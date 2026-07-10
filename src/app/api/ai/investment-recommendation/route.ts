import { NextRequest, NextResponse } from "next/server";
import { getInvestmentAdvice } from "@/lib/ai/investment-advisor";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY is not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { idleAmount, totalBalance, monthlyFixedExpenses, expectedYield, productName } =
      body;

    if (typeof idleAmount !== "number" || typeof totalBalance !== "number") {
      return NextResponse.json(
        { error: "Required: idleAmount (number), totalBalance (number)" },
        { status: 400 }
      );
    }

    const advice = await getInvestmentAdvice({
      idleAmount,
      totalBalance,
      monthlyFixedExpenses,
      expectedYield,
      productName,
    });

    return NextResponse.json(advice);
  } catch (error) {
    console.error("[AI Investment Recommendation]", error);
    const message =
      error instanceof Error ? error.message : "AI recommendation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
