import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteFooter from "../../../components/SiteFooter";
import SiteHeader from "../../../components/SiteHeader";
import { attachmentName, weaponImageUrl, weapons } from "../../../lib/catalog";

type History = {
  stat_key: string;
  before_value: string | null;
  after_value: string | null;
  unit: string | null;
  changed_at: string;
  patch_versions: { version: string } | null;
};

type Ranking = {
  attachment_keys: string[];
  kill_count: number;
  sample_matches: number;
  top_player_observations: number;
  popularity_score: number;
  confidence: number;
  window_days: number;
  stat_date: string;
};

const statLabels: Record<string, string> = {
  base_damage: "피해량",
  rpm: "연사 속도",
  muzzle_velocity: "탄속",
  magazine_size: "탄창 용량",
  reload_seconds: "재장전",
  horizontal_recoil: "수평 반동",
  vertical_recoil: "수직 반동",
};

async function query<T>(table: string, search: URLSearchParams): Promise<T[]> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return [];
  const response = await fetch(`${url}/rest/v1/${table}?${search}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    next: { revalidate: 900 },
  });
  return response.ok ? response.json() : [];
}

export function generateStaticParams() {
  return weapons.map((weapon) => ({ slug: weapon.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const weapon = weapons.find((item) => item.slug === slug);
  return {
    title: weapon ? `${weapon.name} 스펙·파츠 추천·패치 이력` : "총기 정보",
    description: weapon ? `${weapon.name}의 PUBG 최신 스펙, 실전 파츠 조합과 패치 변경 이력을 확인하세요.` : undefined,
    alternates: { canonical: `/weapons/${slug}` },
  };
}

export default async function WeaponDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const weapon = weapons.find((item) => item.slug === slug);
  if (!weapon) notFound();

  const [history, rankings] = await Promise.all([
    query<History>("weapon_spec_history", new URLSearchParams({
      select: "stat_key,before_value,after_value,unit,changed_at,patch_versions(version)",
      weapon_key: `eq.${weapon.key}`,
      order: "changed_at.desc",
      limit: "20",
    })),
    query<Ranking>("weapon_loadout_rankings", new URLSearchParams({
      select: "attachment_keys,kill_count,sample_matches,top_player_observations,popularity_score,confidence,window_days,stat_date",
      weapon_key: `eq.${weapon.key}`,
      window_days: "eq.30",
      stat_date: "gte.2026-08-12",
      order: "stat_date.desc,popularity_score.desc",
      limit: "6",
    })),
  ]);
  const recommendations = rankings.filter((row) => row.attachment_keys.length >= 2).slice(0, 3);

  return (
    <main>
      <SiteHeader />
      <div className="page-shell subpage-shell">
        <header className="weapon-detail-head">
          <div className="weapon-detail-image"><img src={weaponImageUrl(weapon)} alt={`${weapon.name} 총기`} /></div>
          <div><span>{weapon.category} · {weapon.ammo}</span><h1>{weapon.name}</h1><p>현재 스펙과 패치 이력, 실제 킬 시점 파츠 표본을 한 화면에 정리했습니다.</p></div>
        </header>

        <section className="weapon-spec-cards">
          <article><span>기본 피해량</span><strong>{weapon.damageDisplay}</strong></article>
          <article><span>RPM</span><strong>{weapon.rpm ?? "—"}</strong></article>
          <article><span>탄속</span><strong>{weapon.velocity ? `${weapon.velocity}m/s` : "—"}</strong></article>
          <article><span>탄창</span><strong>{weapon.magazine}{weapon.extendedMagazine ? ` / ${weapon.extendedMagazine}` : ""}</strong></article>
          <article><span>이론 DPS</span><strong>{weapon.rpm ? Math.round(weapon.damage * weapon.rpm / 60) : "—"}</strong></article>
        </section>

        <section className="weapon-detail-section">
          <div className="home-section-head"><div><span>UPDATE 42.3 TELEMETRY</span><h2>실전 파츠 추천 조합</h2></div><p>킬 시점 장착 조합 + 상위권 최근 경기 표본</p></div>
          <p className="live-meta-note"><strong>UPDATE 42.3 초기 표본</strong> 패치 적용일 이후 관측 1건부터 참고용 순위에 반영합니다.</p>
          {recommendations.length ? <div className="recommendation-grid">{recommendations.map((row, index) => (
            <article key={`${row.stat_date}-${index}`}><span>추천 {index + 1}</span><h3>{row.attachment_keys.map(attachmentName).join(" + ")}</h3><dl><div><dt>관측 킬</dt><dd>{row.kill_count}</dd></div><div><dt>상위권 관측</dt><dd>{row.top_player_observations}</dd></div><div><dt>신뢰도</dt><dd>{Math.round(Number(row.confidence) * 100)}%</dd></div></dl></article>
          ))}</div> : <div className="collection-empty"><strong>표본을 모으는 중입니다.</strong><p>파츠 2개 이상이 확인된 킬·상위권 세팅이 충분히 쌓이면 자동으로 추천 순위를 표시합니다.</p></div>}
          <p className="live-meta-note">전체 PUBG 이용자를 대표하지 않는 BGI 수집 표본입니다. 조합 간 표본이 적을 때는 추천보다 관측 정보로 해석해 주세요.</p>
        </section>

        <section className="weapon-detail-section">
          <div className="home-section-head"><div><span>REVIEWED HISTORY</span><h2>패치 변경 이력</h2></div></div>
          {history.length ? <div className="history-list">{history.map((row) => (
            <article key={`${row.changed_at}-${row.stat_key}`}><strong>{row.patch_versions?.version ? `UPDATE ${row.patch_versions.version}` : "패치"}</strong><p>{statLabels[row.stat_key] ?? row.stat_key} <b>{row.before_value ?? "—"}{row.unit ?? ""} → {row.after_value ?? "—"}{row.unit ?? ""}</b></p><time>{row.changed_at.slice(0, 10)}</time></article>
          ))}</div> : <div className="collection-empty"><strong>{weapon.change ?? "검수된 수치 변경 이력이 없습니다."}</strong><p>자동 감지된 공식 패치 내용은 관리자 승인 후 이 목록과 현재 스펙에 함께 반영됩니다.</p></div>}
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
