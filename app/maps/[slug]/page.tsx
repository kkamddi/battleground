import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PubgMapExplorer from "../../../components/PubgMapExplorer";
import SiteHeader from "../../../components/SiteHeader";
import { mapCatalog, mapSlugs, type MapSlug } from "../../../lib/mapData";

type MapPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return mapSlugs.filter((slug) => slug !== "erangel").map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: MapPageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!mapSlugs.includes(slug as MapSlug)) return {};
  const map = mapCatalog[slug as MapSlug];
  return {
    title: `${map.nameKo} 지도`,
    description: `${map.nameKo} 일반전${map.ranked ? "·경쟁전" : ""} 차량, 보트와 주요 시설 위치를 확인하세요.`,
    alternates: { canonical: `/maps/${slug}` },
    openGraph: {
      type: "website",
      locale: "ko_KR",
      url: `/maps/${slug}`,
      siteName: "BGI",
      title: `${map.nameKo} 지도`,
      description: `${map.nameKo} 차량, 보트와 주요 시설 위치를 한눈에 확인하세요.`,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${map.nameKo} 지도` }],
    },
  };
}

export default async function MapPage({ params }: MapPageProps) {
  const { slug } = await params;
  if (!mapSlugs.includes(slug as MapSlug) || slug === "erangel") notFound();
  return <main><SiteHeader /><PubgMapExplorer mapSlug={slug as MapSlug} /></main>;
}
