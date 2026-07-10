import {
  Wallet,
  CreditCard,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface SummaryCardsProps {
  totalBalance: number;
  pendingSettlement: number;
  investmentValue: number;
  balanceChange: number;
  settlementChange: number;
  investmentYield: number;
}

export function SummaryCards({
  totalBalance,
  pendingSettlement,
  investmentValue,
  balanceChange,
  settlementChange,
  investmentYield,
}: SummaryCardsProps) {
  const cards = [
    {
      title: "총 자산 잔고",
      value: formatCurrency(totalBalance),
      change: balanceChange,
      icon: Wallet,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "이번 달 카드 매출 정산 예정",
      value: formatCurrency(pendingSettlement),
      change: settlementChange,
      icon: CreditCard,
      iconBg: "bg-violet-100",
      iconColor: "text-violet-600",
    },
    {
      title: "AI 투자 자산 현황",
      value: formatCurrency(investmentValue),
      change: investmentYield,
      icon: TrendingUp,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      isPercent: true,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.title} className="border-slate-200/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              {card.title}
            </CardTitle>
            <div className={`rounded-lg p-2 ${card.iconBg}`}>
              <card.icon className={`h-4 w-4 ${card.iconColor}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">{card.value}</div>
            <div className="mt-1 flex items-center gap-1 text-xs">
              {card.change >= 0 ? (
                <ArrowUpRight className="h-3 w-3 text-emerald-500" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-500" />
              )}
              <span
                className={
                  card.change >= 0 ? "text-emerald-600" : "text-red-600"
                }
              >
                {card.isPercent
                  ? `+${card.change.toFixed(1)}%`
                  : `${card.change >= 0 ? "+" : ""}${card.change.toFixed(1)}%`}
              </span>
              <span className="text-slate-400">전월 대비</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
