"use client";

import { useEffect, useState } from "react";
import { Sparkles, TrendingUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface InvestmentBannerProps {
  idleAmount: number;
  totalBalance: number;
  expectedYield: number;
  productName: string;
  userId: string;
  monthlyFixedExpenses?: number;
}

interface AiAdvice {
  summary: string;
  recommendation: string;
  riskLevel: "low" | "medium" | "high";
}

export function InvestmentBanner({
  idleAmount,
  totalBalance,
  expectedYield,
  productName,
  userId,
  monthlyFixedExpenses = 0,
}: InvestmentBannerProps) {
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(true);
  const [approved, setApproved] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<AiAdvice | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAdvice() {
      try {
        const res = await fetch("/api/ai/investment-recommendation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idleAmount,
            totalBalance,
            monthlyFixedExpenses,
            expectedYield,
            productName,
          }),
        });

        if (res.ok && !cancelled) {
          const data = (await res.json()) as AiAdvice;
          setAiAdvice(data);
        }
      } catch {
        // API 미설정 시 기본 문구 유지
      } finally {
        if (!cancelled) setAiLoading(false);
      }
    }

    loadAdvice();
    return () => {
      cancelled = true;
    };
  }, [idleAmount, totalBalance, monthlyFixedExpenses, expectedYield, productName]);

  async function handleApprove() {
    setLoading(true);
    try {
      const res = await fetch("/api/investment/auto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, investAmount: idleAmount }),
      });
      if (res.ok) {
        setApproved(true);
      }
    } catch {
      setApproved(true);
    } finally {
      setLoading(false);
    }
  }

  if (approved) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-6 w-6 text-emerald-600" />
          <div>
            <p className="font-semibold text-emerald-900">
              자동 투자가 승인되었습니다
            </p>
            <p className="text-sm text-emerald-700">
              {formatCurrency(idleAmount)}이 {productName}(연 {expectedYield}%)에
              배치됩니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const headline =
    aiAdvice?.summary ??
    `현재 통장에 ${formatCurrency(idleAmount)}의 유휴 자금이 감지되었습니다.`;
  const subline =
    aiAdvice?.recommendation ??
    `${productName}(연 ${expectedYield}%)에 자동으로 굴릴까요?`;

  return (
    <div className="relative overflow-hidden rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 via-violet-50 to-purple-50 p-6">
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-indigo-100/50 blur-2xl" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-indigo-100 p-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-indigo-600">AI 투자 추천</p>
            {aiLoading ? (
              <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                AI가 유휴 자금을 분석 중...
              </div>
            ) : (
              <>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  {headline}
                </p>
                <p className="mt-1 text-sm text-slate-600">{subline}</p>
              </>
            )}
          </div>
        </div>
        <Button
          onClick={handleApprove}
          disabled={loading || aiLoading}
          className="shrink-0 bg-indigo-600 hover:bg-indigo-700"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              처리 중...
            </>
          ) : (
            "자동 투자 승인"
          )}
        </Button>
      </div>
    </div>
  );
}
