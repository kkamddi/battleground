import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BGN | PUBG 패치와 총기 데이터",
  description: "PUBG 패치노트, 총기 스펙과 변경 이력을 확인하는 정보 서비스입니다.",
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
