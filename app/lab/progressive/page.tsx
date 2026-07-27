import type { Metadata } from "next";
import SiteFooter from "../../../components/SiteFooter";
import SiteHeader from "../../../components/SiteHeader";
import { progressiveCatalog } from "../../../data/progressiveCatalog";
import ProgressiveCatalog from "./ProgressiveCatalog";

export const metadata: Metadata = {
  title: "PUBG 성장형 스킨 아카이브",
  description: "역대 PUBG 성장형 무기 스킨과 공식 레벨별 외형 변화, 배틀스탯, 킬피드 및 부착물 해금 정보를 확인합니다.",
  alternates: { canonical: "/lab/progressive" },
};

async function officialImages(): Promise<Record<string, string>> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return {};

  const search = new URLSearchParams({
    select: "slug,image_url",
    review_status: "eq.approved",
    image_url: "not.is.null",
  });
  const response = await fetch(`${url}/rest/v1/progressive_skins?${search}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    next: { revalidate: 3600 },
  });
  if (!response.ok) return {};

  const rows = await response.json() as Array<{ slug: string; image_url: string | null }>;
  return Object.fromEntries(rows.filter((row) => row.image_url).map((row) => [row.slug, row.image_url as string]));
}

export default async function ProgressivePage() {
  const images = await officialImages();
  return (
    <main>
      <SiteHeader />
      <div className="page-shell subpage-shell">
        <header className="page-heading">
          <span>LAB 03 · PROGRESSIVE SKIN ARCHIVE</span>
          <h1>성장형 스킨 아카이브</h1>
          <p>역대 성장형 스킨을 무기별로 찾고, 공식 자료에서 확인된 레벨별 외형 변화와 기능 해금을 한눈에 비교합니다.</p>
        </header>
        <ProgressiveCatalog skins={progressiveCatalog} images={images} />
        <aside className="calculation-notice">
          <strong>자료 기준</strong>
          <p>공식 상점 공지의 명칭과 레벨 설명을 우선 사용합니다. 공식 레벨 정보가 아직 확인되지 않은 항목은 출시 목록만 표시하며, 게임 파일 추출 이미지나 추정 단계는 사용하지 않습니다.</p>
        </aside>
      </div>
      <SiteFooter />
    </main>
  );
}
