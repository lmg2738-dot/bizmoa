import { NextResponse } from "next/server";
import { getMarketOverview } from "@/lib/kexim/market-data";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export async function GET() {
  try {
    const overview = await getMarketOverview();
    return NextResponse.json(overview);
  } catch (error) {
    console.error("[Market Overview]", error);
    const message =
      error instanceof Error ? error.message : "Market data fetch failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
