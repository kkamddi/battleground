import type { Metadata } from "next";
import "./globals.css";

const siteUrl = "https://battleground-info.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "BGI — BattleGround Information",
    template: "%s | BGI",
  },
  description: "PUBG 최신 패치노트, 총기 스펙과 변경 이력, 공식 메타 통계와 플레이 가이드를 확인하세요.",
  applicationName: "BGI",
  keywords: ["배틀그라운드", "PUBG", "패치노트", "총기 스펙", "총기 도감", "메타 통계", "플레이 가이드"],
  creator: "BGI",
  publisher: "BGI",
  verification: { google: "73w1RX9gnTnkQ5xPTdZ2a4jRl9pQJCwEET4LPf9KExI" },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: siteUrl,
    siteName: "BGI",
    title: "BGI — BattleGround Information",
    description: "PUBG 패치노트, 총기 데이터, 메타 통계와 플레이 가이드.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "BGI — BattleGround Information" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "BGI — BattleGround Information",
    description: "PUBG 패치노트, 총기 데이터, 메타 통계와 플레이 가이드.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "BGI",
    alternateName: "BattleGround Information",
    url: siteUrl,
    inLanguage: "ko-KR",
    description: "PUBG 패치노트, 총기 데이터, 메타 통계와 플레이 가이드.",
  };

  return (
    <html lang="ko">
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd).replace(/</g, "\\u003c") }}
        />
      </body>
    </html>
  );
}
