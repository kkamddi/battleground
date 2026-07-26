import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LOOKDOWN — PUBG 메타 데이터",
  description: "패치노트부터 총기 스펙과 표본 메타까지 한눈에 확인하세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
