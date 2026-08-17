import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteFooter from "../../../../components/SiteFooter";
import SiteHeader from "../../../../components/SiteHeader";
import PlayerSearchForm from "../../../../components/PlayerSearchForm";
import PlayerTools from "../../../../components/PlayerTools";
import PlayerShareCard from "../../../../components/PlayerShareCard";
import MatchReplay from "../../../../components/MatchReplay";
import { weapons } from "../../../../lib/catalog";
import { getPlayerBenchmark } from "../../../../lib/playerArchive";
import {
  getPlayerProfile,
  PlayerModeStats,
  PubgPlatform,
  PlayerProfile,
  PubgApiError,
  RecentMatch,
} from "../../../../lib/pubg";

export const dynamic = "force-dynamic";

const mapNames: Record<string, string> = {
  Baltic_Main: "에란겔",
  Chimera_Main: "파라모",
  Desert_Main: "미라마",
  DihorOtok_Main: "비켄디",
  Heaven_Main: "헤이븐",
  Kiki_Main: "데스턴",
  Neon_Main: "론도",
  Savage_Main: "사녹",
  Summerland_Main: "카라킨",
  Tiger_Main: "태이고",
};

const modeNames: Record<string, string> = {
  duo: "듀오 TPP",
  "duo-fpp": "듀오 FPP",
  solo: "솔로 TPP",
  "solo-fpp": "솔로 FPP",
  squad: "스쿼드 TPP",
  "squad-fpp": "스쿼드 FPP",
};

const tierNames: Record<string, string> = {
  Bronze: "브론즈",
  Diamond: "다이아몬드",
  Gold: "골드",
  Master: "마스터",
  Platinum: "플래티넘",
  Silver: "실버",
  Unranked: "언랭크",
};

function number(value: number | undefined, digits = 0) {
  return Number(value ?? 0).toLocaleString("ko-KR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

function ratio(value: number | undefined) {
  const raw = Number(value ?? 0);
  return `${number(raw <= 1 ? raw * 100 : raw, 1)}%`;
}

function preferredMode(modes: Record<string, PlayerModeStats>) {
  const entries = Object.entries(modes).filter(([, stats]) => Number(stats.roundsPlayed ?? 0) > 0);
  return entries.sort((a, b) => Number(b[1].roundsPlayed ?? 0) - Number(a[1].roundsPlayed ?? 0))[0];
}

function tier(stats: PlayerModeStats) {
  const current = stats.currentTier ?? stats.bestTier;
  if (!current?.tier) return "배치 전";
  const name = tierNames[current.tier] ?? current.tier;
  return current.subTier ? `${name} ${current.subTier}` : name;
}

function time(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remain = Math.floor(seconds % 60);
  return `${minutes}분 ${remain}초`;
}

type MatchGroup = {
  games: number;
  kills: number;
  damage: number;
  wins: number;
  top10s: number;
};

function groupMatches(matches: RecentMatch[], key: "mapName" | "gameMode") {
  const groups = new Map<string, MatchGroup>();
  for (const match of matches) {
    const current = groups.get(match[key]) ?? { games: 0, kills: 0, damage: 0, wins: 0, top10s: 0 };
    current.games += 1;
    current.kills += match.kills;
    current.damage += match.damage;
    current.wins += match.placement === 1 ? 1 : 0;
    current.top10s += match.placement > 0 && match.placement <= 10 ? 1 : 0;
    groups.set(match[key], current);
  }
  return [...groups.entries()].sort((a, b) => b[1].games - a[1].games);
}

function recentAverage(matches: RecentMatch[]) {
  const games = matches.length || 1;
  return {
    kills: matches.reduce((sum, match) => sum + match.kills, 0) / games,
    damage: matches.reduce((sum, match) => sum + match.damage, 0) / games,
    placement: matches.reduce((sum, match) => sum + match.placement, 0) / games,
    survival: matches.reduce((sum, match) => sum + match.survivalSeconds, 0) / games,
    longestKill: Math.max(0, ...matches.map((match) => match.longestKill)),
    movement: matches.reduce((sum, match) => sum + match.walkDistance + match.rideDistance, 0) / games,
  };
}

function matchRating(match: RecentMatch) {
  const placementScore = match.placement > 0 ? Math.max(0, 35 - match.placement) : 0;
  const value = match.kills * 12 + match.damage / 18 + placementScore + match.dbnos * 3 + match.assists * 2;
  if (value >= 90) return "캐리 경기";
  if (value >= 65) return "좋은 경기";
  if (value >= 40) return "안정적인 경기";
  return "아쉬운 경기";
}

function score(value: number, low: number, high: number) {
  return Math.max(0, Math.min(100, ((value - low) / (high - low)) * 100));
}

function deviation(values: number[]) {
  if (!values.length) return 0;
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.sqrt(values.reduce((sum, value) => sum + (value - average) ** 2, 0) / values.length);
}

function playStyle(matches: RecentMatch[]) {
  const sample = matches.slice(0, 10);
  const games = sample.length || 1;
  const average = recentAverage(sample);
  const perGame = (key: "assists" | "boosts" | "dbnos" | "heals" | "revives") =>
    sample.reduce((sum, match) => sum + match[key], 0) / games;
  const totalKills = sample.reduce((sum, match) => sum + match.kills, 0);
  const headshotRate = totalKills
    ? sample.reduce((sum, match) => sum + match.headshotKills, 0) / totalKills
    : 0;
  const top10Rate = sample.filter((match) => match.placement > 0 && match.placement <= 10).length / games;
  const longRangeRate = sample.filter((match) => match.longestKill >= 150).length / games;
  const rideDistance = sample.reduce((sum, match) => sum + match.rideDistance, 0);
  const totalDistance = sample.reduce((sum, match) => sum + match.rideDistance + match.walkDistance, 0);
  const rideRate = totalDistance ? rideDistance / totalDistance : 0;
  const killScore = score(average.kills, 0.5, 4);
  const damageScore = score(average.damage, 80, 450);
  const dbnoScore = score(perGame("dbnos"), 0.2, 3);
  const combatScore = killScore * 0.4 + damageScore * 0.35 + dbnoScore * 0.25;
  const survivalScore = score(average.survival, 500, 1_600) * 0.4
    + top10Rate * 100 * 0.35
    + (100 - score(average.placement, 5, 30)) * 0.25;
  const supportScore = score(perGame("assists"), 0.1, 2) * 0.45
    + score(perGame("revives"), 0, 1) * 0.35
    + dbnoScore * 0.2;
  const mobilityScore = score(average.movement, 1_500, 8_000) * 0.65 + rideRate * 100 * 0.35;
  const coreScores = [combatScore, survivalScore, supportScore, mobilityScore];
  const balanceScore = 35
    + (coreScores.reduce((sum, value) => sum + value, 0) / coreScores.length) * 0.35
    + (100 - (Math.max(...coreScores) - Math.min(...coreScores))) * 0.3;
  const styles = [
    {
      name: "교전 주도형",
      value: combatScore,
      description: "킬·피해량·DBNO가 고르게 높아 교전의 주도권을 잡는 플레이가 두드러집니다.",
    },
    {
      name: "화력 지원형",
      value: damageScore * 0.45 + dbnoScore * 0.3 + Math.max(0, damageScore - killScore) * 0.25,
      description: "높은 피해량과 DBNO로 적의 전력을 먼저 깎아 팀의 마무리를 돕는 플레이가 두드러집니다.",
    },
    {
      name: "헤드헌터형",
      value: headshotRate * 100 * 0.65 + killScore * 0.35,
      description: "킬 중 헤드샷 비중과 킬 생산력이 높아 정밀한 조준 능력이 강점으로 나타납니다.",
    },
    {
      name: "원거리 견제형",
      value: longRangeRate * 100 * 0.7 + score(average.longestKill, 80, 300) * 0.3,
      description: "장거리 킬이 반복적으로 확인되어 DMR·SR을 활용한 거리 유지에 강점이 있습니다.",
    },
    {
      name: "생존 운영형",
      value: survivalScore,
      description: "생존 시간·평균 순위·Top 10 진입률이 높아 자기장 운영과 후반 진입이 안정적입니다.",
    },
    {
      name: "기동 운영형",
      value: mobilityScore,
      description: "이동 거리와 차량 이동 비중이 높아 빠른 로테이션과 선점 플레이가 두드러집니다.",
    },
    {
      name: "팀 서포터형",
      value: supportScore,
      description: "어시스트·부활·DBNO 기여도가 높아 스쿼드의 교전 지속력을 끌어올리는 유형입니다.",
    },
    {
      name: "균형 성장형",
      value: balanceScore,
      description: "교전·생존·기동·지원 지표가 한쪽에 치우치지 않고 고르게 나타나는 유형입니다.",
    },
  ].sort((a, b) => b.value - a.value);

  const top10Matches = sample.filter((match) => match.placement > 0 && match.placement <= 10);
  const top10Average = recentAverage(top10Matches);
  const recent = recentAverage(sample.slice(0, 5));
  const previous = recentAverage(sample.slice(5, 10));
  const stabilityScore = sample.length >= 5
    ? 100 - (
      score(deviation(sample.map((match) => match.kills)), 0, 2.5)
      + score(deviation(sample.map((match) => match.damage)), 0, 250)
      + score(deviation(sample.map((match) => match.placement)), 0, 20)
    ) / 3
    : 0;
  const traits = [
    {
      name: "후반 클러치",
      value: top10Rate * 40 + score(top10Average.kills, 1, 4) * 0.3 + score(top10Average.damage, 150, 500) * 0.3,
    },
    { name: "차량 로테이션", value: rideRate * 100 },
    {
      name: "회복 유지력",
      value: score(perGame("heals") + perGame("boosts"), 2, 8) * 0.65
        + score(average.survival, 600, 1_500) * 0.35,
    },
    { name: "안정적인 경기력", value: stabilityScore },
    {
      name: "폭발적인 고점",
      value: Math.max(
        score(Math.max(0, ...sample.map((match) => match.kills)) - average.kills, 1, 6),
        score(Math.max(0, ...sample.map((match) => match.damage)) - average.damage, 100, 600),
      ),
    },
    {
      name: "최근 상승세",
      value: sample.length >= 10
        ? score((recent.kills - previous.kills) * 25 + (recent.damage - previous.damage) / 4 + (previous.placement - recent.placement) * 3, 5, 100)
        : 0,
    },
  ]
    .filter((trait) => trait.value >= 65)
    .sort((a, b) => b.value - a.value)
    .slice(0, 2)
    .map((trait) => trait.name);

  return {
    ...styles[0],
    traits,
    confidence: sample.length >= 10 ? "분석 신뢰도 높음" : sample.length >= 5 ? "예비 분석" : "분석 표본 부족",
  };
}

function profileMetrics(profile: PlayerProfile, queue?: string, selectedMode?: string) {
  const selected = (modes: Record<string, PlayerModeStats>) => {
    const stats = selectedMode ? modes[selectedMode] : undefined;
    return stats && Number(stats.roundsPlayed ?? 0) > 0 ? [selectedMode, stats] as [string, PlayerModeStats] : undefined;
  };
  const ranked = selected(profile.rankedModes) ?? preferredMode(profile.rankedModes);
  const season = selected(profile.seasonModes) ?? preferredMode(profile.seasonModes);
  const primary = queue === "normal" ? season : queue === "ranked" ? ranked : ranked ?? season;
  const [modeKey, stats] = primary ?? ["squad-fpp", {}];
  const rounds = Number(stats.roundsPlayed ?? 0);
  const wins = Number(stats.wins ?? 0);
  const kills = Number(stats.kills ?? 0);
  const deaths = Math.max(rounds - wins, 0);
  return {
    modeKey,
    stats,
    ranked: queue === "ranked" ? true : queue === "normal" ? false : primary === ranked,
    rounds,
    wins,
    kills,
    kd: Number(stats.kdr ?? 0) || (deaths ? kills / deaths : kills),
    adr: rounds ? Number(stats.damageDealt ?? 0) / rounds : 0,
  };
}

function coachReport(matches: RecentMatch[]) {
  const sample = matches.slice(0, 10);
  const games = sample.length || 1;
  const average = recentAverage(sample);
  const total = (key: "assists" | "dbnos" | "revives") => sample.reduce((sum, match) => sum + match[key], 0);
  const top10Rate = sample.filter((match) => match.placement > 0 && match.placement <= 10).length / games;
  const rideDistance = sample.reduce((sum, match) => sum + match.rideDistance, 0);
  const totalDistance = sample.reduce((sum, match) => sum + match.rideDistance + match.walkDistance, 0);
  const categories = [
    { name: "교전", value: Math.round(score(average.damage, 70, 400) * .55 + score(average.kills, .3, 3) * .45) },
    { name: "생존", value: Math.round(score(average.survival, 420, 1_500) * .55 + top10Rate * 45) },
    { name: "운영", value: Math.round(score(average.movement, 1_000, 7_000) * .6 + (totalDistance ? rideDistance / totalDistance : 0) * 40) },
    { name: "팀 기여", value: Math.round(score((total("assists") + total("revives")) / games, 0, 2) * .7 + score(total("dbnos") / games, 0, 2.5) * .3) },
  ].map((category) => ({ ...category, value: Math.max(0, Math.min(100, category.value)) }));

  const damagePerKill = average.damage / Math.max(average.kills, .25);
  const weakest = [...categories].sort((a, b) => a.value - b.value)[0];
  let diagnosis = weakest.name === "교전"
    ? "생존과 운영에 비해 교전 성과가 낮습니다. 유리한 자리에서 먼저 사격할 수 있는 교전을 선택해 보세요."
    : weakest.name === "생존"
      ? "교전 성과에 비해 생존 지표가 낮습니다. 교전 직후 정비와 다음 안전 구역 진입을 앞당겨 보세요."
      : weakest.name === "운영"
        ? "전투 성과에 비해 이동과 운영 지표가 낮습니다. 첫 자기장부터 이동 수단과 다음 거점을 준비해 보세요."
        : "개인 전투 지표는 강점이지만 팀 기여는 보완할 여지가 있습니다. 팀 간격을 좁혀 함께 사격할 기회를 늘려 보세요.";
  if (average.damage >= 180 && average.kills < 1) diagnosis = "피해량에 비해 킬 전환이 낮습니다. 첫 타격 이후 확정 각과 팀의 집중 사격을 연결하는 과정이 핵심입니다.";
  else if (average.kills >= 1.5 && top10Rate < .3) diagnosis = "초중반 교전 성과는 좋지만 후반 진입률이 낮습니다. 교전 직후 정비 시간을 줄이고 다음 안전 구역을 먼저 잡는 편이 유리합니다.";
  else if (top10Rate >= .5 && average.damage < 150) diagnosis = "후반까지 살아남는 운영은 안정적이지만 유효 교전이 적습니다. 유리한 지형에서 먼저 사격할 수 있는 자리를 만드는 것이 다음 단계입니다.";

  const missions: string[] = [];
  if (damagePerKill > 180 || (average.damage >= 140 && average.kills < 1)) missions.push("다운을 만든 교전은 시야를 유지해 킬 전환률을 높이기");
  if (top10Rate < .4) missions.push("첫 10분 생존과 Top 10 진입을 우선 목표로 잡기");
  if (average.movement < 2_500) missions.push("첫 자기장 확정 뒤 이동 수단과 다음 거점을 먼저 확보하기");
  if ((total("assists") + total("revives")) / games < .7) missions.push("교전 전 팀 간격을 좁혀 어시스트·부활 기회를 만들기");
  if (!missions.length) missions.push("현재 강점을 유지하며 최근 평균 피해량을 10% 높이기");

  return { categories, diagnosis, missions: missions.slice(0, 2), games: sample.length };
}

function growthReport(matches: RecentMatch[]) {
  if (matches.length < 10) return null;
  const currentMatches = matches.slice(0, 5);
  const previousMatches = matches.slice(5, 10);
  const current = recentAverage(currentMatches);
  const previous = recentAverage(previousMatches);
  const averagePlacement = (sample: RecentMatch[]) => {
    const placements = sample.map((match) => match.placement).filter((placement) => placement > 0);
    return placements.length ? placements.reduce((sum, placement) => sum + placement, 0) / placements.length : 0;
  };
  const placementDelta = averagePlacement(previousMatches) - averagePlacement(currentMatches);
  const metrics = [
    { name: "평균 킬", value: current.kills - previous.kills, weight: (current.kills - previous.kills) / .7 },
    { name: "평균 피해량", value: current.damage - previous.damage, weight: (current.damage - previous.damage) / 80 },
    { name: "평균 생존", value: (current.survival - previous.survival) / 60, weight: (current.survival - previous.survival) / 240 },
    { name: "평균 순위", value: placementDelta, weight: placementDelta / 6 },
  ];
  const driver = [...metrics].sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))[0];
  const direction = metrics.reduce((sum, metric) => sum + metric.weight, 0) / metrics.length;
  const status = direction > .35 ? "상승세" : direction < -.35 ? "하락세" : "유지 중";
  const summaries: Record<string, [string, string]> = {
    "평균 킬": ["최근 경기에서는 킬 생산 증가가 상승세를 가장 크게 이끌었습니다.", "최근 경기에서는 킬 생산 감소가 흐름을 가장 크게 낮췄습니다."],
    "평균 피해량": ["최근 경기에서는 교전 피해량 증가가 상승세를 가장 크게 이끌었습니다.", "최근 경기에서는 교전 피해량 감소가 흐름을 가장 크게 낮췄습니다."],
    "평균 생존": ["최근 경기에서는 생존 시간 증가가 상승세를 가장 크게 이끌었습니다.", "최근 경기에서는 생존 시간 감소가 흐름을 가장 크게 낮췄습니다."],
    "평균 순위": ["최근 경기에서는 평균 순위 개선이 상승세를 가장 크게 이끌었습니다.", "최근 경기에서는 평균 순위 하락이 흐름을 가장 크게 낮췄습니다."],
  };
  return { metrics, status, summary: summaries[driver.name][driver.value >= 0 ? 0 : 1] };
}

function mapReport(groups: Array<[string, MatchGroup]>) {
  const eligible = groups
    .filter(([key, value]) => Boolean(mapNames[key]) && value.games >= 2)
    .map(([key, value]) => ({
      name: mapNames[key] ?? key,
      games: value.games,
      adr: value.damage / value.games,
      kills: value.kills / value.games,
      top10: value.top10s / value.games,
      score: value.damage / value.games + (value.kills / value.games) * 70 + (value.top10s / value.games) * 120,
    }))
    .sort((a, b) => b.score - a.score);
  if (eligible.length < 2) return null;
  return { strong: eligible[0], weak: eligible[eligible.length - 1] };
}

function teammateReport(matches: RecentMatch[]) {
  const teammates = new Map<string, {
    name: string;
    games: number;
    top10s: number;
    combinedKills: number;
    combinedDamage: number;
    teammateDamage: number;
  }>();
  for (const match of matches) {
    for (const teammate of match.teammates ?? []) {
      const key = teammate.accountId || teammate.name;
      const current = teammates.get(key) ?? {
        name: teammate.name,
        games: 0,
        top10s: 0,
        combinedKills: 0,
        combinedDamage: 0,
        teammateDamage: 0,
      };
      current.games += 1;
      current.top10s += match.placement > 0 && match.placement <= 10 ? 1 : 0;
      current.combinedKills += match.kills + teammate.kills;
      current.combinedDamage += match.damage + teammate.damage;
      current.teammateDamage += teammate.damage;
      teammates.set(key, current);
    }
  }
  return [...teammates.values()]
    .filter((teammate) => teammate.games >= 2)
    .map((teammate) => {
      const top10Rate = teammate.top10s / teammate.games;
      const combinedKills = teammate.combinedKills / teammate.games;
      const combinedDamage = teammate.combinedDamage / teammate.games;
      const chemistry = Math.round(
        top10Rate * 45
        + score(combinedKills, .5, 6) * .25
        + score(combinedDamage, 150, 700) * .3,
      );
      return {
        ...teammate,
        top10Rate,
        combinedKills,
        chemistry,
        teammateAdr: teammate.teammateDamage / teammate.games,
        label: chemistry >= 75 ? "찰떡 호흡" : chemistry >= 55 ? "좋은 호흡" : "호흡 맞추는 중",
      };
    })
    .sort((a, b) => b.games - a.games || b.chemistry - a.chemistry)
    .slice(0, 3);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ nickname: string; platform?: string }>;
}): Promise<Metadata> {
  const { nickname, platform } = await params;
  const decoded = decodeURIComponent(nickname);
  const platformName = platform === "kakao" ? "Kakao" : "Steam";
  return {
    title: `${decoded} ${platformName} PUBG 전적`,
    description: `${decoded}의 ${platformName} PUBG 현재 시즌 경쟁전과 최근 매치 전적을 확인하세요.`,
  };
}

export default async function PlayerPage({
  params,
  searchParams,
}: {
  params: Promise<{ nickname: string; platform?: string }>;
  searchParams: Promise<{ compare?: string; mode?: string; queue?: string }>;
}) {
  const { nickname, platform: routePlatform } = await params;
  const { compare, mode, queue } = await searchParams;
  if (routePlatform && routePlatform !== "kakao") notFound();
  const platform: PubgPlatform = routePlatform === "kakao" ? "kakao" : "steam";
  const platformName = platform === "kakao" ? "Kakao" : "Steam";
  const decoded = decodeURIComponent(nickname);
  let profile: PlayerProfile | null = null;
  let comparison: PlayerProfile | null = null;
  let error = "";
  try {
    profile = await getPlayerProfile(decoded, platform);
    if (compare) comparison = await getPlayerProfile(decodeURIComponent(compare), platform);
  } catch (cause) {
    if (cause instanceof PubgApiError && cause.status === 429) {
      error = "현재 검색 요청이 많습니다. 잠시 후 다시 시도해 주세요.";
    } else if (cause instanceof PubgApiError && cause.status === 503) {
      error = "전적 검색 서버 설정을 마무리하고 있습니다.";
    } else {
      error = "PUBG 전적을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
    }
  }

  if (!profile) {
    return (
      <main>
        <SiteHeader />
        <div className="page-shell player-shell">
          <section className="player-empty">
            <span>PLAYER SEARCH</span>
            <h1>{error ? "전적을 불러오지 못했습니다" : "플레이어를 찾을 수 없습니다"}</h1>
            <p>{error || `${platformName} PUBG의 정확한 게임 내 닉네임을 확인해 주세요.`}</p>
            <PlayerSearchForm platform={platform} />
          </section>
        </div>
        <SiteFooter />
      </main>
    );
  }

  const { modeKey, stats, ranked, rounds, wins, kills, kd, adr } = profileMetrics(profile, queue, mode);
  const benchmark = await getPlayerBenchmark(profile, modeKey, ranked);
  const modeSource = ranked ? profile.rankedModes : profile.seasonModes;
  const availableModes = Object.entries(modeSource)
    .filter(([, value]) => Number(value.roundsPlayed ?? 0) > 0)
    .sort((a, b) => Number(b[1].roundsPlayed ?? 0) - Number(a[1].roundsPlayed ?? 0));
  const playerPath = `/player/${platform}/${encodeURIComponent(profile.name)}`;
  const reportLink = (nextQueue: "ranked" | "normal", nextMode?: string) => {
    const query = new URLSearchParams({ queue: nextQueue });
    if (nextMode) query.set("mode", nextMode);
    if (compare) query.set("compare", compare);
    return `${playerPath}?${query}`;
  };
  const maps = groupMatches(profile.recentMatches, "mapName");
  const modes = groupMatches(profile.recentMatches, "gameMode");
  const style = playStyle(profile.recentMatches);
  const recent = recentAverage(profile.recentMatches.slice(0, 5));
  const topWeapon = profile.weaponStats[0];
  const topAttachment = profile.attachmentStats[0];
  const killLoadouts = profile.killLoadoutStats ?? [];
  const topLoadout = killLoadouts[0];
  const recentSample = profile.recentMatches.slice(0, 10);
  const recentGames = recentSample.length || 1;
  const recentKills = recentSample.reduce((sum, match) => sum + match.kills, 0);
  const recentHeadshots = recentSample.reduce((sum, match) => sum + match.headshotKills, 0);
  const teamActions = recentSample.reduce((sum, match) => sum + match.assists + match.revives, 0);
  const topWeaponCatalog = topWeapon
    ? weapons.find((weapon) => weapon.name.toLowerCase() === topWeapon.name.toLowerCase())
    : undefined;
  const reportConfidence = Math.min(100, Math.round((profile.recentMatches.length / 32) * 100));
  const trendMatches = profile.recentMatches.slice(0, 10).reverse();
  const maxTrendDamage = Math.max(1, ...trendMatches.map((match) => match.damage));
  const winRate = ratio(stats.winRatio ?? (rounds ? wins / rounds : 0));
  const coach = coachReport(profile.recentMatches);
  const growth = growthReport(profile.recentMatches);
  const mapFit = mapReport(maps);
  const teammateFit = teammateReport(profile.recentMatches);

  return (
    <main>
      <SiteHeader />
      <div className="page-shell player-shell">
        <section className="player-heading">
          <div>
            <span>BGI PLAYER REPORT · {platformName.toUpperCase()}</span>
            <h1>{profile.name}</h1>
            <p>현재 시즌 · {modeNames[modeKey] ?? modeKey}</p>
          </div>
          <PlayerSearchForm compact platform={platform} />
        </section>
        <PlayerTools nickname={profile.name} platform={platform} />

        <nav className="player-mode-filter" aria-label="전적 유형과 모드 선택">
          <div>
            <a className={ranked ? "active" : ""} href={reportLink("ranked")}>경쟁전</a>
            <a className={!ranked ? "active" : ""} href={reportLink("normal")}>일반전</a>
          </div>
          <div>
            {availableModes.map(([key]) => (
              <a className={key === modeKey ? "active" : ""} href={reportLink(ranked ? "ranked" : "normal", key)} key={key}>
                {modeNames[key] ?? key}
              </a>
            ))}
          </div>
        </nav>

        <section className="player-summary">
          <article className="player-tier">
            <span>{ranked ? "현재 경쟁전" : "현재 일반전"}</span>
            <strong>{rounds ? ranked ? tier(stats) : modeNames[modeKey] ?? modeKey : "기록 없음"}</strong>
            <p>{rounds ? ranked ? `${number(stats.rankPoints)} RP · ${number(rounds)}경기` : `${number(rounds)}경기 일반전` : "선택한 모드의 시즌 기록이 없습니다."}</p>
          </article>
          <dl>
            <div><dt>K/D</dt><dd>{number(kd, 2)}</dd></div>
            <div><dt>평균 피해량</dt><dd>{number(adr, 1)}</dd></div>
            <div><dt>승률</dt><dd>{ratio(stats.winRatio ?? (rounds ? wins / rounds : 0))}</dd></div>
            <div><dt>Top 10</dt><dd>{ratio(stats.top10Ratio ?? (rounds ? Number(stats.top10s ?? 0) / rounds : 0))}</dd></div>
            <div><dt>킬</dt><dd>{number(kills)}</dd></div>
            <div><dt>최장 거리 킬</dt><dd>{number(stats.longestKill, 0)}m</dd></div>
          </dl>
        </section>

        {benchmark ? (
          <section className="player-benchmark">
            <div><span>BGI PERCENTILE</span><strong>{`${benchmark.sampleSize}명 비교`}</strong></div>
            {benchmark.metrics.map((metric) => (
              <article key={metric.label}><span>{metric.label}</span><strong>{`상위 ${metric.topPercent}%`}</strong></article>
            ))}
          </section>
        ) : null}

        {comparison ? (
          <section className="player-comparison">
            <div className="home-section-head">
              <div><span>HEAD TO HEAD</span><h2>플레이어 비교</h2></div>
              <p>각 플레이어의 현재 시즌 주력 모드 기준</p>
            </div>
            <div className="comparison-table">
              {[
                ["플레이어", profile.name, comparison.name],
                ["K/D", number(kd, 2), number(profileMetrics(comparison).kd, 2)],
                ["평균 피해량", number(adr, 1), number(profileMetrics(comparison).adr, 1)],
                ["승률", ratio(stats.winRatio ?? (rounds ? wins / rounds : 0)), ratio(profileMetrics(comparison).stats.winRatio)],
                ["최근 5경기 평균 킬", number(recent.kills, 1), number(recentAverage(comparison.recentMatches.slice(0, 5)).kills, 1)],
                ["최근 5경기 평균 피해", number(recent.damage, 1), number(recentAverage(comparison.recentMatches.slice(0, 5)).damage, 1)],
              ].map(([label, first, second]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{first}</strong>
                  <strong>{second}</strong>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="player-report-intro">
          <div><span>PERSONAL REPORT</span><h2>{profile.name} · <span>플레이 리포트</span></h2></div>
          <p>{`${profile.recentMatches.length}경기 분석 · 신뢰도 ${reportConfidence}%`}</p>
        </section>

        <section className="player-report-facts" aria-label="최근 플레이 핵심 지표">
          <div><span>교전</span><strong>{number(recent.kills, 1)}킬 · ADR {number(recent.damage, 0)}</strong></div>
          <div><span>헤드샷 비중</span><strong>{ratio(recentKills ? recentHeadshots / recentKills : 0)}</strong></div>
          <div><span>팀 기여</span><strong>경기당 {number(teamActions / recentGames, 1)}회</strong></div>
          <div><span>평균 이동</span><strong>{number(recent.movement / 1000, 1)}km</strong></div>
        </section>

        <section className="player-coach-report">
          <div className="home-section-head">
            <div><span>BGI COACH</span><h2>왜 이런 전적이 나왔을까?</h2></div>
          </div>
          <div className="coach-score-grid">
            {coach.categories.map((category) => (
              <article key={category.name}>
                <span>{category.name}</span><strong>{category.value}</strong>
                <i><b style={{ width: `${category.value}%` }} /></i>
              </article>
            ))}
          </div>
          <div className="coach-guidance">
            <article><span>분석</span><p>{coach.diagnosis}</p></article>
            <article><span>다음 경기 미션</span><ol>{coach.missions.map((mission) => <li key={mission}>{mission}</li>)}</ol></article>
          </div>
        </section>

        {growth || mapFit ? (
          <section className={`player-growth-report ${growth && mapFit ? "" : "single"}`}>
            {growth ? <div className="growth-trend">
              <div className="home-section-head">
                <div><span>BGI GROWTH TRACKER</span><h2>최근 5경기는 왜 달라졌을까?</h2></div>
                <strong className={`growth-status ${growth.status === "상승세" ? "up" : growth.status === "하락세" ? "down" : ""}`}>{growth.status}</strong>
              </div>
              <p className="growth-summary">{growth.summary}</p>
              <div className="growth-metrics">
                {growth.metrics.map((metric) => (
                  <article key={metric.name}>
                    <span>{metric.name}</span>
                    <strong>{metric.value > 0 ? "+" : ""}{number(metric.value, 1)}</strong>
                    <small>이전 5경기 대비</small>
                  </article>
                ))}
              </div>
            </div> : null}
            {mapFit ? <div className="map-fit-report">
              <div className="home-section-head">
                <div><span>MAP FIT</span><h2>내 맵 궁합</h2></div>
                <p>2경기 이상 플레이한 맵 기준</p>
              </div>
              <div>
                {[{ label: "강한 맵", map: mapFit.strong }, { label: "보완할 맵", map: mapFit.weak }].map(({ label, map }) => (
                  <article key={label}>
                    <span>{label}</span><h3>{map.name}</h3>
                    <dl>
                      <div><dt>표본</dt><dd>{`${map.games}경기`}</dd></div>
                      <div><dt>ADR</dt><dd>{number(map.adr, 0)}</dd></div>
                      <div><dt>평균 킬</dt><dd>{number(map.kills, 1)}</dd></div>
                      <div><dt>Top 10</dt><dd>{ratio(map.top10)}</dd></div>
                    </dl>
                  </article>
                ))}
              </div>
            </div> : null}
          </section>
        ) : null}

        {teammateFit.length ? (
          <section className="teammate-report">
            <div className="home-section-head">
              <div><span>SQUAD CHEMISTRY</span><h2>자주 함께한 팀원과의 호흡</h2></div>
              <p>2회 이상 함께한 팀원</p>
            </div>
            <div className="teammate-report-grid">
              {teammateFit.map((teammate) => (
                <article key={teammate.name}>
                  <div><span>{teammate.label}</span><strong>{teammate.chemistry}</strong></div>
                  <h3>{teammate.name}</h3>
                  <dl>
                    <div><dt>함께한 경기</dt><dd>{`${teammate.games}경기`}</dd></div>
                    <div><dt>둘의 평균 킬</dt><dd>{number(teammate.combinedKills, 1)}</dd></div>
                    <div><dt>팀원 ADR</dt><dd>{number(teammate.teammateAdr, 0)}</dd></div>
                    <div><dt>함께한 Top 10</dt><dd>{ratio(teammate.top10Rate)}</dd></div>
                  </dl>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <PlayerShareCard
          adr={adr}
          kd={kd}
          nickname={profile.name}
          platform={platformName}
          recentDamage={recent.damage}
          recentKills={recent.kills}
          styleName={style.name}
          topWeapon={topWeapon?.name}
          winRate={winRate}
        />

        <section className="player-analysis-grid">
          <article className="style-card">
            <span>BGI PLAY STYLE</span>
            <h2>{style.name}</h2>
            <p>{style.description}</p>
            <p className="style-traits">
              <b>{style.confidence}</b>
              {style.traits.length ? ` · ${style.traits.join(" · ")}` : " · 보조 특성 분석 중"}
            </p>
            <dl>
              <div><dt>최근 평균 킬</dt><dd>{number(recent.kills, 1)}</dd></div>
              <div><dt>최근 평균 피해</dt><dd>{number(recent.damage, 0)}</dd></div>
              <div><dt>평균 생존</dt><dd>{time(recent.survival)}</dd></div>
            </dl>
          </article>
          <article className="recommend-card">
            <span>BGI PERSONAL PICK</span>
            <h2>맞춤 추천</h2>
            <p>
              {topWeapon
                ? `${topWeapon.name}에서 최근 가장 많은 킬이 확인됐습니다. 총기 도감에서 거리별 TTK와 추천 파츠를 함께 확인해 보세요.`
                : style.name === "원거리 견제형"
                  ? "DMR·SR의 거리별 피해 감소와 배율 조합을 우선 확인해 보세요."
                  : "최근 킬 무기 표본이 더 쌓이면 개인 총기 추천이 표시됩니다."}
            </p>
            {topAttachment ? <b>자주 장착한 파츠 · {topAttachment.name}</b> : null}
            {topLoadout ? (
              <small>
                킬 확인 조합 · {topLoadout.weapon}
                {topLoadout.attachments.length ? ` + ${topLoadout.attachments.join(" · ")}` : " · 파츠 없음"}
              </small>
            ) : null}
            {topWeaponCatalog ? <a href={`/weapons/${topWeaponCatalog.slug}`}>{topWeaponCatalog.name} 스펙·실전 추천 보기 →</a> : null}
          </article>
        </section>

        {trendMatches.length ? (
          <section className="player-form-chart">
            <div className="home-section-head">
              <div><span>LAST 10 MATCHES</span><h2>최근 폼 그래프</h2></div>
              <p>경기별 피해량 추이 · 상단 K는 킬 수</p>
            </div>
            <div className="form-chart" aria-label="최근 10경기 피해량과 킬 추이">
              <span className="form-chart-axis">피해량</span>
              {trendMatches.map((match, index) => (
                <div className="form-chart-item" key={match.id} title={`${number(match.damage, 0)} 피해량 · ${match.kills}킬`}>
                  <b>{match.kills}K</b>
                  <i style={{ height: `${Math.max(8, (match.damage / maxTrendDamage) * 100)}%` }} />
                  <span>{number(match.damage, 0)}</span>
                  <small>{match.createdAt ? new Date(match.createdAt).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" }).replace(/\. /g, ".").replace(/\.$/, "") : index + 1}</small>
                </div>
              ))}
            </div>
            <div className="form-chart-legend"><span>이전</span><span>최근</span></div>
          </section>
        ) : null}

        <section className="player-breakdown">
          <div className="home-section-head">
            <div><span>RECENT BREAKDOWN</span><h2>맵·모드별 전적</h2></div>
            <p>최근 14일 내 최대 32경기 표본</p>
          </div>
          <div className="breakdown-columns">
            <div>
              <h3>맵별</h3>
              {maps.map(([key, value]) => (
                <article key={key}>
                  <strong>{mapNames[key] ?? key}</strong>
                  <span>{value.games}경기</span>
                  <span>K/D {number(value.kills / Math.max(value.games - value.wins, 1), 2)}</span>
                  <span>ADR {number(value.damage / value.games, 0)}</span>
                  <span>Top 10 {ratio(value.top10s / value.games)}</span>
                </article>
              ))}
            </div>
            <div>
              <h3>모드별</h3>
              {modes.map(([key, value]) => (
                <article key={key}>
                  <strong>{modeNames[key] ?? key}</strong>
                  <span>{value.games}경기</span>
                  <span>평균 킬 {number(value.kills / value.games, 1)}</span>
                  <span>ADR {number(value.damage / value.games, 0)}</span>
                  <span>승률 {ratio(value.wins / value.games)}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="player-loadout-report">
          <div className="home-section-head">
            <div><span>TELEMETRY REPORT</span><h2>내 총기·파츠 리포트</h2></div>
            <p>최근 최대 10경기의 킬·장착 이벤트 기준</p>
          </div>
          <div className="loadout-columns">
            <div>
              <h3>킬 무기</h3>
              {profile.weaponStats.length ? profile.weaponStats.slice(0, 6).map((weapon) => (
                <article key={weapon.name}>
                  <strong>{weapon.name}</strong>
                  <span>{weapon.kills}킬</span>
                  <span>평균 {number(weapon.averageDistance, 0)}m</span>
                  <span>최장 {number(weapon.longestDistance, 0)}m</span>
                </article>
              )) : <p className="player-no-matches">최근 표본에서 확인된 킬 무기가 없습니다.</p>}
            </div>
            <div>
              <h3>자주 장착한 파츠</h3>
              {profile.attachmentStats.length ? profile.attachmentStats.slice(0, 8).map((attachment) => (
                <article key={attachment.name}>
                  <strong>{attachment.name}</strong>
                  <span>{attachment.equips}회 장착</span>
                </article>
              )) : <p className="player-no-matches">최근 표본에서 확인된 파츠 장착 기록이 없습니다.</p>}
            </div>
          </div>
          <div className="kill-loadout-report">
            <h3>킬 발생 당시 파츠 조합</h3>
            {killLoadouts.length ? killLoadouts.slice(0, 6).map((loadout, index) => (
              <article key={`${loadout.weapon}-${loadout.attachments.join("-")}-${index}`}>
                <span>{index + 1}</span>
                <strong>{loadout.weapon}</strong>
                <p>{loadout.attachments.length ? loadout.attachments.join(" · ") : "확인된 파츠 없음"}</p>
                <b>{loadout.kills}킬</b>
              </article>
            )) : <p className="player-no-matches">최근 표본에서 킬 당시 파츠 조합을 확인하지 못했습니다.</p>}
          </div>
        </section>

        <section className="recent-matches">
          <div className="home-section-head">
            <div><span>최근 14일</span><h2>최근 매치</h2></div>
            <p>공식 API에서 확인 가능한 최근 경기 기준</p>
          </div>
          {profile.recentMatches.length ? (
            <div className="match-list">
              {profile.recentMatches.map((match) => (
                <details className="match-detail" key={match.id}>
                  <summary>
                    <div>
                      <span>{mapNames[match.mapName] ?? match.mapName}</span>
                      <strong>#{match.placement || "—"}</strong>
                    </div>
                    <p>{modeNames[match.gameMode] ?? match.gameMode}</p>
                    <dl>
                      <div><dt>킬</dt><dd>{match.kills}</dd></div>
                      <div><dt>피해량</dt><dd>{number(match.damage, 0)}</dd></div>
                      <div><dt>생존</dt><dd>{time(match.survivalSeconds)}</dd></div>
                    </dl>
                    <time dateTime={match.createdAt}>
                      {match.createdAt ? new Date(match.createdAt).toLocaleDateString("ko-KR") : "날짜 없음"}
                    </time>
                  </summary>
                  <div className="match-detail-body">
                    <div><span>BGI 경기 평가</span><strong>{matchRating(match)}</strong></div>
                    <div><span>교전 기여</span><strong>{match.dbnos} DBNO · {match.assists} 어시스트</strong></div>
                    <div><span>팀 지원</span><strong>{match.revives} 부활 · {match.heals + match.boosts} 회복</strong></div>
                    <div><span>정밀 사격</span><strong>{match.headshotKills} 헤드샷 · {number(match.longestKill, 0)}m</strong></div>
                    <div><span>이동 거리</span><strong>{number((match.walkDistance + match.rideDistance) / 1000, 1)}km</strong></div>
                  </div>
                  <MatchReplay accountId={profile.accountId} matchId={match.id} platform={platform} />
                </details>
              ))}
            </div>
          ) : (
            <div className="player-no-matches">최근 14일 이내 확인 가능한 매치가 없습니다.</div>
          )}
        </section>

        <p className="player-data-note">
          PUBG 공식 API와 텔레메트리의 {platformName} PC 데이터입니다. 플레이 스타일과 추천은 최근 표본을 바탕으로 계산한 BGI 분석이며 공식 PUBG 평가가 아닙니다. 최근 매치는 공식 API 보존 범위인 최근 14일 내 최대 32개를 표시하며 API 갱신 시점에 따라 게임 직후 기록이 늦게 보일 수 있습니다.
        </p>
      </div>
      <SiteFooter />
    </main>
  );
}
