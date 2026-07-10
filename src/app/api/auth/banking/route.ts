import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCodeForToken,
  getOpenBankingAuthUrl,
} from "@/lib/banking/openbanking";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "authorize") {
      const userId = searchParams.get("userId");
      if (!userId) {
        return NextResponse.json(
          { error: "userId is required" },
          { status: 400 }
        );
      }
      const state = Buffer.from(
        JSON.stringify({ userId, ts: Date.now() })
      ).toString("base64url");
      const authUrl = getOpenBankingAuthUrl(state);
      return NextResponse.json({ authUrl, state });
    }

    return NextResponse.json(
      { error: "Invalid action. Use ?action=authorize&userId=..." },
      { status: 400 }
    );
  } catch (error) {
    console.error("[OpenBanking Auth GET]", error);
    return NextResponse.json(
      { error: "Failed to generate authorization URL" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, userId, bankCode, bankName, accountNumber } = body;

    if (!code || !userId || !bankCode || !bankName || !accountNumber) {
      return NextResponse.json(
        {
          error:
            "Required fields: code, userId, bankCode, bankName, accountNumber",
        },
        { status: 400 }
      );
    }

    const result = await exchangeCodeForToken(
      code,
      userId,
      bankCode,
      bankName,
      accountNumber
    );

    return NextResponse.json({
      success: true,
      accountId: result.account.id,
      userSeqNo: result.userSeqNo,
    });
  } catch (error) {
    console.error("[OpenBanking Auth POST]", error);
    const message =
      error instanceof Error ? error.message : "Token exchange failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
