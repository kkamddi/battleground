import type { Metadata } from "next";
import "./globals.css";

const siteUrl = "https://battleground-info.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "PUBG 전적검색·총기·맵 정보 | BGI",
    template: "%s | BGI",
  },
  description: "Steam·Kakao PUBG 전적검색과 경쟁전 랭킹, 총기 스펙·파츠 추천, 패치노트와 맵 정보를 확인하세요.",
  applicationName: "BGI",
  keywords: ["배틀그라운드 전적검색", "PUBG 전적검색", "PUBG", "경쟁전 랭킹", "총기 스펙", "파츠 추천", "배틀그라운드 지도", "패치노트"],
  creator: "BGI",
  publisher: "BGI",
  verification: {
    google: "73w1RX9gnTnkQ5xPTdZ2a4jRl9pQJCwEET4LPf9KExI",
    other: {
      "naver-site-verification": "68e38f9c35d151935e91728b59562718afb17c61",
    },
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: siteUrl,
    siteName: "BGI",
    title: "PUBG 전적검색·총기·맵 정보 | BGI",
    description: "Steam·Kakao PUBG 전적검색, 경쟁전 랭킹, 총기·파츠와 맵 정보.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "BGI — BattleGround Information" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PUBG 전적검색·총기·맵 정보 | BGI",
    description: "Steam·Kakao PUBG 전적검색, 경쟁전 랭킹, 총기·파츠와 맵 정보.",
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
