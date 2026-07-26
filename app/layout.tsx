import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BGN — 배틀그라운드 뉴스와 총기 데이터",
  description: "PUBG 패치노트, 전체 총기 스펙과 변경 이력을 간결하게 확인하세요.",
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
