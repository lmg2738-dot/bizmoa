import { SummaryCards } from "@/components/dashboard/summary-cards";
import { FxWidget } from "@/components/dashboard/fx-widget";
import { TransactionTable } from "@/components/dashboard/transaction-table";
import { InvestmentBanner } from "@/components/dashboard/investment-banner";
import { Building2, Bell, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMarketOverview } from "@/lib/kexim/market-data";

export const dynamic = "force-dynamic";

const MOCK_USER_ID = "mock-user-001";

const MOCK_DASHBOARD = {
  summary: {
    totalBalance: 28_450_000,
    pendingSettlement: 4_820_000,
    investmentValue: 12_300_000,
    balanceChange: 3.2,
    settlementChange: 8.5,
    investmentYield: 3.5,
  },
  investment: {
    idleAmount: 3_400_000,
    expectedYield: 3.5,
    productName: "단기 안전자산",
  },
  transactions: [
    {
      id: "tx-001",
      type: "INCOME" as const,
      description: "카드 매출 정산 (시뮬레이션)",
      amount: 1_250_000,
      transactionDate: "2026-07-10T09:00:00",
      source: "PG",
    },
    {
      id: "tx-002",
      type: "EXPENSE" as const,
      description: "7월 임대료 이체",
      amount: 800_000,
      transactionDate: "2026-07-09T14:30:00",
      source: "은행",
    },
    {
      id: "tx-003",
      type: "INCOME" as const,
      description: "부트페이 정산 입금 (시뮬레이션)",
      amount: 620_000,
      transactionDate: "2026-07-09T11:00:00",
      source: "PG",
    },
    {
      id: "tx-004",
      type: "EXPENSE" as const,
      description: "원재료 대금",
      amount: 450_000,
      transactionDate: "2026-07-08T16:45:00",
      source: "은행",
    },
    {
      id: "tx-005",
      type: "EXPENSE" as const,
      description: "AI 추천 유휴자금 배치 (시뮬레이션)",
      amount: 2_000_000,
      transactionDate: "2026-07-07T10:00:00",
      source: "투자",
    },
    {
      id: "tx-006",
      type: "INCOME" as const,
      description: "입금 (시뮬레이션)",
      amount: 3_100_000,
      transactionDate: "2026-07-06T13:20:00",
      source: "은행",
    },
  ],
};

const FALLBACK_FX = {
  fxRates: [
    {
      currency: "USD",
      label: "미국 달러",
      rate: 1382.5,
      buyRate: 1365.0,
      sellRate: 1400.0,
      change: 0,
    },
    {
      currency: "EUR",
      label: "유로",
      rate: 1498.2,
      buyRate: 1480.0,
      sellRate: 1516.0,
      change: 0,
    },
  ],
  macroIndicators: [
    {
      label: "수출입은행 데이터",
      value: "API 키 확인 필요",
      updatedAt: "-",
    },
  ],
  searchDate: "",
};

export default async function DashboardPage() {
  const { summary, investment, transactions } = MOCK_DASHBOARD;

  let market = FALLBACK_FX;
  try {
    const overview = await getMarketOverview();
    market = {
      fxRates: overview.fxRates,
      macroIndicators: overview.macroIndicators,
      searchDate: overview.searchDate,
    };
  } catch (error) {
    console.error("[Dashboard] market data fallback:", error);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">비즈모아</h1>
              <p className="text-xs text-slate-500">BizMoa Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            안녕하세요, 사업자님 👋
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            수출입은행 환율·금리와 AI 투자 추천을 확인하세요.
          </p>
        </div>

        <SummaryCards {...summary} />

        <InvestmentBanner
          idleAmount={investment.idleAmount}
          totalBalance={summary.totalBalance}
          expectedYield={investment.expectedYield}
          productName={investment.productName}
          userId={MOCK_USER_ID}
          monthlyFixedExpenses={2_250_000}
        />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <TransactionTable transactions={transactions} />
          </div>
          <div>
            <FxWidget
              rates={market.fxRates}
              indicators={market.macroIndicators}
              searchDate={market.searchDate}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
