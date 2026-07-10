import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "비즈모아 (BizMoa) - AI 기반 자금 관리",
  description:
    "개인사업자 및 소상공인을 위한 AI 기반 자동 자금 집행 및 스마트 세무·재테크 비서",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
