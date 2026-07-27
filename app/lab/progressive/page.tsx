import type { Metadata } from "next";
import SiteFooter from "../../../components/SiteFooter";
import SiteHeader from "../../../components/SiteHeader";
import { weaponName } from "../../../lib/catalog";

type Level = { level: number; description_ko: string };
type Skin = {
  slug: string;
  name: string;
  weapon_key: string;
  max_level: number;
  image_url: string | null;
  acquisition: string | null;
  availability_status: string;
  source_url: string;
  progressive_skin_levels: Level[];
};

const fallback: Skin[] = [
  { slug: "pretend-prototype-slr", name: "Pretend Prototype", weapon_key: "Item_Weapon_FNFal_C", max_level: 10, image_url: null, acquisition: "밀수품 상자 · 스크랩 상점", availability_status: "available", source_url: "https://pubg.com/en/news/10427", progressive_skin_levels: ["기본 스킨","헤드샷 배틀스탯","무기 살펴보기","탄창·총구 스킨","중간 외형","킬피드 스킨","조준경·개머리판 스킨","전리품 상자","최종 외형","킬 이펙트"].map((description_ko, index) => ({ level: index + 1, description_ko })) },
  { slug: "cosmic-caliber-kar98k", name: "Cosmic Caliber", weapon_key: "Item_Weapon_Kar98k_C", max_level: 10, image_url: null, acquisition: "밀수품 상자 · 스크랩 상점", availability_status: "ended", source_url: "https://pubg.com/en/news/9892", progressive_skin_levels: ["기본 스킨","킬 배틀스탯","무기 살펴보기","탄창·총구 스킨","중간 외형","킬피드 스킨","조준경·개머리판 스킨","전리품 상자","최종 외형","킬 이펙트"].map((description_ko, index) => ({ level: index + 1, description_ko })) },
];

export const metadata: Metadata = {
  title: "PUBG 성장형 무기 미리보기",
  description: "PUBG 공식 상점 공지 기준 성장형 무기의 단계별 외형과 해금 효과를 확인합니다.",
  alternates: { canonical: "/lab/progressive" },
};

async function skins(): Promise<Skin[]> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return fallback;
  const search = new URLSearchParams({
    select: "slug,name,weapon_key,max_level,image_url,acquisition,availability_status,source_url,progressive_skin_levels(level,description_ko)",
    review_status: "eq.approved",
    order: "source_published_at.desc",
  });
  const response = await fetch(`${url}/rest/v1/progressive_skins?${search}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    next: { revalidate: 3600 },
  });
  if (!response.ok) return fallback;
  const rows = await response.json() as Skin[];
  return rows.length ? rows : fallback;
}

export default async function ProgressivePage() {
  const rows = await skins();
  return <main><SiteHeader /><div className="page-shell subpage-shell">
    <header className="page-heading"><span>LAB 03 · OFFICIAL STORE ARCHIVE</span><h1>성장형 무기 미리보기</h1><p>공식 상점 공지에서 검수된 성장 단계와 해금 효과를 빠르게 살펴봅니다.</p></header>
    <section className="progressive-grid">{rows.map((skin) => <article key={skin.slug}>
      <div className={`progressive-visual ${skin.image_url ? "" : "placeholder"}`}>{skin.image_url ? <img src={skin.image_url} alt={`${skin.name} 공식 이미지`} /> : <strong>{weaponName(skin.weapon_key)}</strong>}<span>MAX LV.{skin.max_level}</span></div>
      <div className="progressive-copy"><span>{weaponName(skin.weapon_key)} · {skin.availability_status === "available" ? "판매 중" : "공식 아카이브"}</span><h2>{skin.name}</h2><p>{skin.acquisition}</p>
        <ol>{[...skin.progressive_skin_levels].sort((a, b) => a.level - b.level).map((level) => <li key={level.level}><b>LV.{level.level}</b><span>{level.description_ko}</span></li>)}</ol>
        <a href={skin.source_url} target="_blank" rel="noreferrer">PUBG 공식 공지에서 확인 ↗</a>
      </div>
    </article>)}</section>
    <aside className="calculation-notice"><strong>자료 범위</strong><p>공식 공지 이미지와 단계 설명만 사용합니다. 게임 파일 추출 또는 비공식 3D 모델은 사용하지 않으며, 실제 인게임 외형은 공식 클라이언트에서 확인해야 합니다.</p></aside>
  </div><SiteFooter /></main>;
}
