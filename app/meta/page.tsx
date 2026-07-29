import type { Metadata } from "next";
import SiteFooter from "../../components/SiteFooter";
import SiteHeader from "../../components/SiteHeader";
import { weaponName, weapons } from "../../lib/catalog";
import LiveMetaPanels from "./LiveMetaPanels";

const siteUrl = "https://battleground-info.vercel.app";
const pageTitle = "PUBG 총기별 실전 킬 순위";
const pageDescription = "최근 7일 Steam 공식 API 표본으로 AR·SMG·DMR·SR 총기별 킬 순위, 헤드샷 비율과 평균 교전 거리를 비교하세요.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  keywords: ["PUBG 총기 순위", "배틀그라운드 총기 순위", "PUBG 메타", "AR 순위", "SMG 순위", "DMR 순위", "SR 순위"],
  alternates: { canonical: "/meta" },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "/meta",
    siteName: "BGI",
    title: pageTitle,
    description: pageDescription,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "BGI PUBG 총기별 실전 킬 순위" }],
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: pageDescription,
    images: ["/opengraph-image"],
  },
};

const categories = ["AR", "SMG", "DMR", "SR"] as const;
type WeaponCategory = (typeof categories)[number];

type DailyWeaponRow = {
  stat_date: string;
  weapon_key: string;
  kills: number;
  headshot_kills: number;
  distance_sum_m: number;
  distance_samples: number;
};

type MetaStat = {
  name: string;
  category: WeaponCategory;
  kills: number;
  headshotKills: number;
  distanceSum: number;
  distanceSamples: number;
};

type MetaSnapshot = {
  categoryTotals: Record<WeaponCategory, number>;
  date: string;
  stats: Record<WeaponCategory, MetaStat[]>;
  totalKills: number;
};

async function query<T>(table: string, search: URLSearchParams): Promise<T[]> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return [];
  const response = await fetch(`${url}/rest/v1/${table}?${search}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    next: { revalidate: 900 },
  });
  if (!response.ok) throw new Error(`Supabase ${table} query failed`);
  return response.json();
}

async function queryAll<T>(table: string, search: URLSearchParams): Promise<T[]> {
  const result: T[] = [];
  for (let offset = 0; offset < 20000; offset += 1000) {
    const pageSearch = new URLSearchParams(search);
    pageSearch.set("limit", "1000");
    pageSearch.set("offset", String(offset));
    const page = await query<T>(table, pageSearch);
    result.push(...page);
    if (page.length < 1000) break;
  }
  return result;
}

async function loadMetaSnapshot(): Promise<MetaSnapshot | null> {
  const latest = await query<{ stat_date: string }>("daily_weapon_stats", new URLSearchParams({
    select: "stat_date",
    order: "stat_date.desc",
    limit: "1",
  }));
  if (!latest[0]?.stat_date) return null;

  const latestDate = latest[0].stat_date;
  const start = new Date(`${latestDate}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - 6);
  const rows = await queryAll<DailyWeaponRow>("daily_weapon_stats", new URLSearchParams({
    select: "stat_date,weapon_key,kills,headshot_kills,distance_sum_m,distance_samples",
    stat_date: `gte.${start.toISOString().slice(0, 10)}`,
    order: "stat_date.asc,platform.asc,game_mode.asc,map_name.asc,weapon_key.asc",
  }));

  const combined = new Map<string, MetaStat>();
  for (const row of rows) {
    const name = weaponName(row.weapon_key);
    const category = weapons.find((weapon) => weapon.name === name)?.category as WeaponCategory | undefined;
    if (!category || !categories.includes(category)) continue;
    const combinedKey = `${category}:${name}`;
    const current = combined.get(combinedKey) ?? {
      name,
      category,
      kills: 0,
      headshotKills: 0,
      distanceSum: 0,
      distanceSamples: 0,
    };
    current.kills += Number(row.kills);
    current.headshotKills += Number(row.headshot_kills);
    current.distanceSum += Number(row.distance_sum_m);
    current.distanceSamples += Number(row.distance_samples);
    combined.set(combinedKey, current);
  }

  const grouped = Object.fromEntries(categories.map((category) => [
    category,
    [...combined.values()]
      .filter((stat) => stat.category === category && stat.kills > 0)
      .sort((a, b) => b.kills - a.kills),
  ])) as Record<WeaponCategory, MetaStat[]>;
  const categoryTotals = Object.fromEntries(categories.map((category) => [
    category,
    grouped[category].reduce((sum, stat) => sum + stat.kills, 0),
  ])) as Record<WeaponCategory, number>;
  const stats = Object.fromEntries(categories.map((category) => [
    category,
    grouped[category].slice(0, 4),
  ])) as Record<WeaponCategory, MetaStat[]>;

  return {
    categoryTotals,
    date: latestDate,
    stats,
    totalKills: [...combined.values()].reduce((sum, stat) => sum + stat.kills, 0),
  };
}

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function formatDate(value: string) {
  return value.replaceAll("-", ".");
}

export default async function MetaPage() {
  let snapshot: MetaSnapshot | null = null;
  try {
    snapshot = await loadMetaSnapshot();
  } catch {
    snapshot = null;
  }
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: pageTitle,
        description: pageDescription,
        url: `${siteUrl}/meta`,
        inLanguage: "ko-KR",
        ...(snapshot?.date ? { dateModified: snapshot.date } : {}),
        isPartOf: {
          "@type": "WebSite",
          name: "BGI",
          url: siteUrl,
        },
        about: categories.map((category) => ({
          "@type": "Thing",
          name: `PUBG ${category} 총기 순위`,
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "홈",
            item: siteUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "총기별 실전 킬 순위",
            item: `${siteUrl}/meta`,
          },
        ],
      },
    ],
  };

  return (
    <main>
      <SiteHeader />
      <div className="page-shell subpage-shell">
        <header className="page-heading">
          <span>META DATA</span>
          <h1>시즌 42 메타 통계</h1>
          <p>최신 적재일 기준 최근 7일 킬을 병과별로 나눠 총기 점유율과 교전 특성을 비교합니다.</p>
        </header>
        <div className="status-panel">
          <span>최근 7일</span><strong>총기별 실전 킬 순위</strong>
          <p>{snapshot ? `${formatDate(snapshot.date)} 조회 · 집계된 킬 ${snapshot.totalKills.toLocaleString("ko-KR")}건 · 매일 갱신` : "최신 통계를 불러오는 중입니다."}</p>
        </div>
        <section className="meta-stat-grid">
          {categories.map((category) => {
            const stat = snapshot?.stats[category][0];
            const categoryKills = snapshot?.categoryTotals[category] ?? 0;
            return (
              <article key={category}>
                <span>{category} 1위{stat ? ` · ${stat.name}` : ""}</span>
                {stat ? <>
                  <div><small>병과 내 킬 비중</small><strong>{categoryKills ? ((stat.kills / categoryKills) * 100).toFixed(1) : "0.0"}%</strong></div>
                  <b>·</b>
                  <div><small>기록된 킬</small><strong>{formatCount(stat.kills)}</strong></div>
                  <p>HS {stat.kills ? ((stat.headshotKills / stat.kills) * 100).toFixed(0) : "0"}% · 평균 {stat.distanceSamples ? (stat.distanceSum / stat.distanceSamples).toFixed(0) : "0"}m</p>
                </> : <div className="collection-empty"><strong>집계 중</strong></div>}
              </article>
            );
          })}
        </section>
        <section className="meta-category-rankings">
          {categories.map((category) => (
            <article key={category}>
              <span>{category}</span>
              <h2>{category} 킬 순위</h2>
              {snapshot?.stats[category].length ? (
                <ol>
                  {snapshot.stats[category].map((stat, index) => (
                    <li key={stat.name}><strong>#{index + 1} {stat.name}</strong><b>{formatCount(stat.kills)}</b></li>
                  ))}
                </ol>
              ) : <div className="collection-empty"><strong>표본 수집 중</strong></div>}
            </article>
          ))}
        </section>
        <LiveMetaPanels />
        <section className="method-box">
          <h2>표본 통계 안내</h2>
          <p>Steam 공식 API로 수집한 최근 7일 매치 표본입니다. AR·SMG·DMR·SR을 병과별로 분리해, 킬 수가 상대적으로 적은 장거리 주무기도 같은 역할군 안에서 비교합니다.</p>
          <div><span>최근 7일</span><span>{snapshot ? `킬 ${snapshot.totalKills.toLocaleString("ko-KR")}건` : "킬 집계 중"}</span><span>Steam 공식 API 표본</span><span>매일 갱신</span><span>조회 {snapshot ? formatDate(snapshot.date) : "갱신 중"}</span></div>
        </section>
      </div>
      <SiteFooter />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
    </main>
  );
}
