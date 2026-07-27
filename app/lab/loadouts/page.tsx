import type { Metadata } from "next";
import SiteFooter from "../../../components/SiteFooter";
import SiteHeader from "../../../components/SiteHeader";
import { attachmentName, weaponName } from "../../../lib/catalog";

type Ranking = {
  weapon_key: string;
  attachment_keys: string[];
  kill_count: number;
  unique_players: number;
  sample_matches: number;
  top_player_observations: number;
  popularity_score: number;
  confidence: number;
  stat_date: string;
};

export const metadata: Metadata = {
  title: "PUBG 실전 파츠 조합",
  description: "PUBG 텔레메트리의 킬 당시 장착 파츠와 경쟁전 상위권 세팅을 총기별로 비교합니다.",
  alternates: { canonical: "/lab/loadouts" },
};

async function rankings(): Promise<Ranking[]> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return [];
  const search = new URLSearchParams({
    select: "weapon_key,attachment_keys,kill_count,unique_players,sample_matches,top_player_observations,popularity_score,confidence,stat_date",
    window_days: "eq.30",
    order: "stat_date.desc,popularity_score.desc",
    limit: "100",
  });
  const response = await fetch(`${url}/rest/v1/weapon_loadout_rankings?${search}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    next: { revalidate: 900 },
  });
  return response.ok ? response.json() : [];
}

export default async function LoadoutsPage() {
  const rows = await rankings();
  const latestDate = rows[0]?.stat_date;
  const latest = rows.filter((row) => row.stat_date === latestDate);
  const perWeapon = new Map<string, Ranking[]>();
  for (const row of latest) {
    if (!perWeapon.has(row.weapon_key)) perWeapon.set(row.weapon_key, []);
    if ((perWeapon.get(row.weapon_key)?.length ?? 0) < 3) perWeapon.get(row.weapon_key)?.push(row);
  }
  return <main><SiteHeader /><div className="page-shell subpage-shell">
    <header className="page-heading"><span>LAB 02 · TELEMETRY LOADOUTS</span><h1>실전 파츠 조합</h1><p>최근 30일 킬 시점 장착 정보와 경쟁전 상위 플레이어 관측을 합쳐 총기별 조합을 보여줍니다.</p></header>
    {perWeapon.size ? <section className="loadout-lab-grid">{[...perWeapon.entries()].map(([weapon, combinations]) => <article key={weapon}>
      <div><span>{combinations.reduce((sum, row) => sum + row.sample_matches, 0).toLocaleString()} 표본 매치</span><h2>{weaponName(weapon)}</h2></div>
      <ol>{combinations.map((row, index) => <li key={`${weapon}-${index}`}><b>{index + 1}</b><p>{row.attachment_keys.map(attachmentName).join(" + ")}</p><small>킬 {row.kill_count} · 상위권 {row.top_player_observations}회 · 신뢰도 {Math.round(Number(row.confidence) * 100)}%</small></li>)}</ol>
    </article>)}</section> : <section className="collection-empty lab-empty"><strong>첫 추천 집계를 준비하고 있습니다.</strong><p>정기 수집 이후 파츠 2개 이상이 확인된 조합부터 이 화면에 표시됩니다.</p></section>}
    <aside className="calculation-notice"><strong>해석 기준</strong><p>추천 점수는 킬 비중 65%, 치킨 보유 표본 15%, 상위권 최근 관측 20%를 반영합니다. 표본 기반 참고 자료이며 한 가지 정답을 의미하지 않습니다.</p></aside>
  </div><SiteFooter /></main>;
}
