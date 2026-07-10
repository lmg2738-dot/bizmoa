import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken } from "@/lib/banking/openbanking";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      console.error("[OpenBanking Callback] OAuth error:", error);
      return NextResponse.redirect(
        new URL(`/dashboard?banking_error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/dashboard?banking_error=missing_code", request.url)
      );
    }

    let userId: string;
    try {
      const decoded = JSON.parse(
        Buffer.from(state, "base64url").toString("utf8")
      );
      userId = decoded.userId;
    } catch {
      return NextResponse.redirect(
        new URL("/dashboard?banking_error=invalid_state", request.url)
      );
    }

    await exchangeCodeForToken(
      code,
      userId,
      "004",
      "KB국민은행",
      "placeholder"
    );

    return NextResponse.redirect(
      new URL("/dashboard?banking_success=true", request.url)
    );
  } catch (err) {
    console.error("[OpenBanking Callback]", err);
    return NextResponse.redirect(
      new URL("/dashboard?banking_error=callback_failed", request.url)
    );
  }
}
