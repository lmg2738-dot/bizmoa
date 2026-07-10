import { Globe, Landmark, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { FxRateItem, MacroIndicator } from "@/lib/kexim/types";

interface FxWidgetProps {
  rates: FxRateItem[];
  indicators: MacroIndicator[];
  searchDate?: string;
}

export function FxWidget({ rates, indicators, searchDate }: FxWidgetProps) {
  return (
    <Card className="border-slate-200/80">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-slate-500" />
            <CardTitle className="text-sm font-medium">
              실시간 환율 & 거시경제
            </CardTitle>
          </div>
          {searchDate && (
            <span className="text-[10px] text-slate-400">
              기준 {searchDate.slice(0, 4)}.{searchDate.slice(4, 6)}.
              {searchDate.slice(6, 8)}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {rates.map((fx) => (
            <div
              key={fx.currency}
              className="rounded-lg border border-slate-100 bg-slate-50/50 p-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">
                  {fx.currency}/KRW
                </span>
                <Badge
                  variant={fx.change >= 0 ? "destructive" : "success"}
                  className="text-[10px]"
                >
                  {fx.change >= 0 ? "+" : ""}
                  {fx.change.toFixed(2)}
                </Badge>
              </div>
              <p className="mt-1 text-lg font-bold">
                {fx.rate.toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-400">{fx.label}</p>
            </div>
          ))}
        </div>
        <div className="space-y-2 border-t border-slate-100 pt-3">
          {indicators.map((ind) => (
            <div
              key={ind.label}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2 text-slate-600">
                {ind.label.includes("금리") ? (
                  <Landmark className="h-3.5 w-3.5" />
                ) : (
                  <BarChart3 className="h-3.5 w-3.5" />
                )}
                <span className="line-clamp-1">{ind.label}</span>
              </div>
              <div className="text-right">
                <span className="font-semibold">{ind.value}</span>
                <p className="text-[10px] text-slate-400">{ind.updatedAt}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
