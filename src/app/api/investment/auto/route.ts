import { NextRequest, NextResponse } from "next/server";
import { executeAutoInvestment } from "@/lib/investment/kis-api";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, investAmount } = body;

    if (!userId || typeof investAmount !== "number") {
      return NextResponse.json(
        { error: "Required fields: userId (string), investAmount (number)" },
        { status: 400 }
      );
    }

    if (!process.env.KIS_APP_KEY || !process.env.KIS_APP_SECRET) {
      return NextResponse.json({
        success: true,
        simulation: true,
        message: "KIS API 미연동 — AI 추천 기반 시뮬레이션 승인",
        newBalance: investAmount,
      });
    }

    const result = await executeAutoInvestment(userId, investAmount);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[Auto Investment]", error);
    const message =
      error instanceof Error ? error.message : "Auto investment failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
