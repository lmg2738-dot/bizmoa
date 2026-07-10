import { chatWithFreeModels } from "@/lib/ai/openrouter";

export interface InvestmentAdviceInput {
  idleAmount: number;
  totalBalance: number;
  monthlyFixedExpenses?: number;
  expectedYield?: number;
  productName?: string;
}

export interface InvestmentAdviceResult {
  recommendation: string;
  summary: string;
  model: string;
  riskLevel: "low" | "medium" | "high";
}

export async function getInvestmentAdvice(
  input: InvestmentAdviceInput
): Promise<InvestmentAdviceResult> {
  const {
    idleAmount,
    totalBalance,
    monthlyFixedExpenses = 0,
    expectedYield = 3.5,
    productName = "발행어음",
  } = input;

  const systemPrompt = `당신은 한국 소상공인·개인사업자를 위한 재무 비서입니다.
유휴 자금 운용 조언만 제공하세요. 투자 원금 손실 가능성이 있는 고위험 상품은 추천하지 마세요.
응답은 반드시 JSON만 출력하세요. 마크다운이나 추가 설명은 금지합니다.
JSON 스키마: {"summary":"한 줄 요약","recommendation":"2~3문장 조언","riskLevel":"low|medium|high"}`;

  const userPrompt = `유휴 자금: ${idleAmount.toLocaleString()}원
총 자산: ${totalBalance.toLocaleString()}원
월 고정 지출 예상: ${monthlyFixedExpenses.toLocaleString()}원
추천 상품: ${productName} (연 ${expectedYield}%)
30일 내 지출을 제외한 잉여 자금만 단기 안전자산에 배치할지 판단해주세요.`;

  const { content, model } = await chatWithFreeModels(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    { maxTokens: 400, temperature: 0.2 }
  );

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch?.[0] ?? content) as {
      summary?: string;
      recommendation?: string;
      riskLevel?: string;
    };

    const riskLevel =
      parsed.riskLevel === "medium" || parsed.riskLevel === "high"
        ? parsed.riskLevel
        : "low";

    return {
      summary:
        parsed.summary ??
        `유휴 자금 ${idleAmount.toLocaleString()}원을 단기 안전자산에 배치할 수 있습니다.`,
      recommendation:
        parsed.recommendation ??
        `${productName} 등 단기 안전자산으로 운용을 검토하세요.`,
      model,
      riskLevel,
    };
  } catch {
    return {
      summary: `유휴 자금 ${idleAmount.toLocaleString()}원 감지`,
      recommendation: content.slice(0, 300),
      model,
      riskLevel: "low",
    };
  }
}
