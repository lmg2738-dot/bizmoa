const OPENROUTER_API_URL = "https://openrouter.ai/api/v1";
const MODELS_CACHE_TTL_MS = 60 * 60 * 1000;
const FREE_MODELS_FALLBACK = ["openrouter/free"] as const;

interface OpenRouterModel {
  id: string;
  name?: string;
  pricing?: {
    prompt?: string;
    completion?: string;
  };
}

interface ModelsResponse {
  data: OpenRouterModel[];
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: { content?: string };
  }>;
  error?: { message?: string; code?: number };
}

let cachedFreeModelIds: string[] | null = null;
let cacheExpiresAt = 0;
const unavailableModels = new Set<string>();

function getApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }
  return key;
}

function isFreeModel(model: OpenRouterModel): boolean {
  const prompt = Number(model.pricing?.prompt ?? -1);
  const completion = Number(model.pricing?.completion ?? -1);
  return prompt === 0 && completion === 0;
}

function isModelUnavailableError(status: number, message: string): boolean {
  if (status === 429 || status === 503) return false;
  if (status === 404) return true;
  const lower = message.toLowerCase();
  return (
    lower.includes("no endpoints") ||
    lower.includes("not found") ||
    lower.includes("does not exist") ||
    lower.includes("model is not available") ||
    lower.includes("invalid model")
  );
}

function getRefererUrl(): string {
  if (process.env.OPENROUTER_SITE_URL) {
    return process.env.OPENROUTER_SITE_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export async function fetchFreeModelIds(): Promise<string[]> {
  const now = Date.now();
  if (cachedFreeModelIds && now < cacheExpiresAt) {
    return cachedFreeModelIds.filter((id) => !unavailableModels.has(id));
  }

  try {
    const res = await fetch(`${OPENROUTER_API_URL}/models?max_price=0`, {
      headers: { Authorization: `Bearer ${getApiKey()}` },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.warn(`[OpenRouter] models fetch failed: ${res.status}`);
      return [...FREE_MODELS_FALLBACK];
    }

    const body = (await res.json()) as ModelsResponse;
    const freeIds = body.data
      .filter(isFreeModel)
      .map((m) => m.id)
      .filter((id) => !unavailableModels.has(id));

    const prioritized = [
      ...freeIds.filter((id) => id.endsWith(":free")),
      ...freeIds.filter((id) => !id.endsWith(":free")),
      ...FREE_MODELS_FALLBACK,
    ];

    const unique = Array.from(new Set(prioritized));
    cachedFreeModelIds = unique;
    cacheExpiresAt = now + MODELS_CACHE_TTL_MS;

    return unique;
  } catch (error) {
    console.warn("[OpenRouter] models fetch error:", error);
    return [...FREE_MODELS_FALLBACK];
  }
}

async function chatWithModel(
  model: string,
  messages: ChatMessage[],
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  const res = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
      "HTTP-Referer": getRefererUrl(),
      "X-Title": process.env.OPENROUTER_APP_NAME ?? "BizMoa",
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: options?.maxTokens ?? 512,
      temperature: options?.temperature ?? 0.3,
    }),
  });

  const body = (await res.json()) as ChatCompletionResponse;
  const errorMessage = body.error?.message ?? "";

  if (!res.ok || errorMessage) {
    if (isModelUnavailableError(res.status, errorMessage)) {
      unavailableModels.add(model);
      cachedFreeModelIds = null;
    }
    throw new Error(
      errorMessage || `OpenRouter request failed (${res.status})`
    );
  }

  const content = body.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("Empty response from OpenRouter");
  }

  return content;
}

export async function chatWithFreeModels(
  messages: ChatMessage[],
  options?: { maxTokens?: number; temperature?: number }
): Promise<{ content: string; model: string }> {
  const models = await fetchFreeModelIds();
  let lastError: Error | null = null;

  for (const model of models) {
    try {
      const content = await chatWithModel(model, messages, options);
      return { content, model };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`[OpenRouter] model ${model} failed:`, lastError.message);
    }
  }

  throw lastError ?? new Error("All free models failed");
}

export function clearOpenRouterModelCache(): void {
  cachedFreeModelIds = null;
  cacheExpiresAt = 0;
}
