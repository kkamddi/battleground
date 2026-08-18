import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { LanguageRuntime } from "../components/LanguageToggle";
import "./globals.css";

const siteUrl = "https://bgi.pwkor.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "배그 전적검색·전적 분석·총기·맵 | BGI",
    template: "%s | BGI",
  },
  description: "Steam·Kakao 배틀그라운드(배그) 전적검색, 플레이 분석과 경쟁전 랭킹, 총기·파츠·맵·패치 정보를 확인하세요.",
  applicationName: "BGI",
  keywords: ["배그 전적검색", "배틀그라운드 전적검색", "PUBG 전적검색", "배그 닉네임 검색", "배그 통계", "경쟁전 랭킹", "총기 스펙", "파츠 추천", "배틀그라운드 지도", "패치노트"],
  category: "games",
  creator: "BGI",
  publisher: "BGI",
  verification: {
    google: [
      "73w1RX9gnTnkQ5xPTdZ2a4jRl9pQJCwEET4LPf9KExI",
      "cZNEEOwP9GKlWTlVVBBDjxkXV3XeIhAz1H3wCxk0CcY",
    ],
    other: {
      "naver-site-verification": [
        "68e38f9c35d151935e91728b59562718afb17c61",
        "c92df88ef5538d3390f3d6fd4b521f26b9df83da",
      ],
    },
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: siteUrl,
    siteName: "BGI",
    title: "배그 전적검색·플레이 분석 | BGI",
    description: "Steam·Kakao 배그 전적검색, 플레이 분석, 경쟁전 랭킹과 총기·맵 정보.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "BGI — BattleGround Information" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "배그 전적검색·플레이 분석 | BGI",
    description: "Steam·Kakao 배그 전적검색, 플레이 분석, 경쟁전 랭킹과 총기·맵 정보.",
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
    description: "Steam·Kakao PUBG 전적검색, 경쟁전 랭킹, 총기·파츠와 맵 정보를 제공하는 한국어 데이터 사이트.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/player/steam/{search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="ko">
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3986607538062091"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <LanguageRuntime />
        {children}
        <Analytics />
        <Script
          data-cf-beacon='{"token":"4dde6b7444214f22bde4246ae9571a9c"}'
          src="https://static.cloudflareinsights.com/beacon.min.js"
          strategy="afterInteractive"
          type="module"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd).replace(/</g, "\\u003c") }}
        />
      </body>
    </html>
  );
}
