import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  BarChart3,
  Shield,
  Sparkles,
  Wallet,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Wallet,
    title: "통합 자금 관리",
    description: "19개 은행 계좌와 PG 매출을 한눈에 모니터링",
  },
  {
    icon: Zap,
    title: "원클릭 이체",
    description: "급여·대금 지급을 비즈모아에서 일괄 처리",
  },
  {
    icon: Sparkles,
    title: "AI 자동 투자",
    description: "유휴 자금을 CMA·발행어음에 자동 배치",
  },
  {
    icon: BarChart3,
    title: "환율·리스크 관리",
    description: "수출입 환율과 정산 일정을 실시간 추적",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-100">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900">
              <Banknote className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold">비즈모아</span>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              대시보드
            </Button>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm text-indigo-700">
          <Sparkles className="h-3.5 w-3.5" />
          AI 기반 자금 집행 & 스마트 세무·재테크
        </div>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          소상공인을 위한
          <br />
          <span className="text-indigo-600">스마트 자금 관리</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
          흩어진 계좌, 파편화된 이체, 방치된 유휴 자금.
          <br />
          비즈모아가 AI로 자금을 통합·최적화합니다.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link href="/dashboard">
            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
              무료로 시작하기
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <p className="text-sm text-slate-500">
            월 9,900원부터 · 14일 무료 체험
          </p>
        </div>
      </section>

      <section className="border-t border-slate-100 bg-slate-50 py-16">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Card key={f.title} className="border-slate-200/80">
              <CardContent className="p-6">
                <div className="mb-4 inline-flex rounded-lg bg-indigo-100 p-2.5">
                  <f.icon className="h-5 w-5 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-100 py-8 text-center text-sm text-slate-500">
        <div className="flex items-center justify-center gap-2">
          <Shield className="h-4 w-4" />
          금융결제원 · KIS · AES-256-GCM 암호화 적용
        </div>
        <p className="mt-2">© 2026 BizMoa. All rights reserved.</p>
      </footer>
    </div>
  );
}
