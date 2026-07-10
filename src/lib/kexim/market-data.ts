import {
  fetchKeximData,
  pickFxRates,
  pickRateIndicators,
} from "@/lib/kexim/client";
import type { MarketOverview } from "@/lib/kexim/types";

function formatDisplayDate(searchDate: string): string {
  if (searchDate.length !== 8) return searchDate;
  return `${searchDate.slice(0, 4)}.${searchDate.slice(4, 6)}.${searchDate.slice(6, 8)}`;
}

export async function getMarketOverview(): Promise<MarketOverview> {
  const exchangeKey = process.env.KEXIM_EXCHANGE_API_KEY;
  const loanKey = process.env.KEXIM_LOAN_RATE_API_KEY;
  const intlKey = process.env.KEXIM_INTL_RATE_API_KEY;

  if (!exchangeKey) {
    throw new Error("KEXIM_EXCHANGE_API_KEY is not configured");
  }

  const [exchange, loan, intl] = await Promise.allSettled([
    fetchKeximData(exchangeKey, "AP01"),
    loanKey ? fetchKeximData(loanKey, "AP02") : Promise.reject(new Error("skip")),
    intlKey ? fetchKeximData(intlKey, "AP03") : Promise.reject(new Error("skip")),
  ]);

  if (exchange.status === "rejected") {
    throw exchange.reason;
  }

  const fxBase = pickFxRates(exchange.value.rows);
  const fxRates = fxBase.map((fx, index) => ({
    ...fx,
    change: index === 0 ? 0 : 0,
  }));

  const macroIndicators: MarketOverview["macroIndicators"] = [];
  const searchDate = exchange.value.searchDate;
  const displayDate = formatDisplayDate(searchDate);

  if (loan.status === "fulfilled") {
    const loanItems = pickRateIndicators(loan.value.rows, "대출금리");
    macroIndicators.push(
      ...loanItems.map((item) => ({
        ...item,
        updatedAt: displayDate,
      }))
    );
  }

  if (intl.status === "fulfilled") {
    const intlItems = pickRateIndicators(intl.value.rows, "국제금리");
    macroIndicators.push(
      ...intlItems.map((item) => ({
        ...item,
        updatedAt: displayDate,
      }))
    );
  }

  if (macroIndicators.length === 0) {
    macroIndicators.push({
      label: "수출입은행 기준일",
      value: displayDate,
      updatedAt: "한국수출입은행",
    });
  }

  return {
    fxRates,
    macroIndicators,
    searchDate,
    fetchedAt: new Date().toISOString(),
  };
}
