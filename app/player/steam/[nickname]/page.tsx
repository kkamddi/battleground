import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteFooter from "../../../../components/SiteFooter";
import SiteHeader from "../../../../components/SiteHeader";
import PlayerSearchForm from "../../../../components/PlayerSearchForm";
import PlayerTools from "../../../../components/PlayerTools";
import { weapons } from "../../../../lib/catalog";
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

function profileMetrics(profile: PlayerProfile) {
  const ranked = preferredMode(profile.rankedModes);
  const season = preferredMode(profile.seasonModes);
  const [modeKey, stats] = ranked ?? season ?? ["squad-fpp", {}];
  const rounds = Number(stats.roundsPlayed ?? 0);
  const wins = Number(stats.wins ?? 0);
  const kills = Number(stats.kills ?? 0);
  const deaths = Number(stats.deaths ?? Math.max(rounds - wins, 0));
  return {
    modeKey,
    stats,
    ranked: Boolean(ranked),
    rounds,
    wins,
    kills,
    kd: stats.kdr ?? (deaths ? kills / deaths : kills),
    adr: rounds ? Number(stats.damageDealt ?? 0) / rounds : 0,
  };
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
  searchParams: Promise<{ compare?: string }>;
}) {
  const { nickname, platform: routePlatform } = await params;
  const { compare } = await searchParams;
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

  const { modeKey, stats, ranked, rounds, wins, kills, kd, adr } = profileMetrics(profile);
  const maps = groupMatches(profile.recentMatches, "mapName");
  const modes = groupMatches(profile.recentMatches, "gameMode");
  const style = playStyle(profile.recentMatches);
  const recent = recentAverage(profile.recentMatches.slice(0, 5));
  const previous = recentAverage(profile.recentMatches.slice(5, 10));
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

        <section className="player-summary">
          <article className="player-tier">
            <span>현재 경쟁전</span>
            <strong>{ranked ? tier(stats) : "경쟁전 기록 없음"}</strong>
            <p>{ranked ? `${number(stats.rankPoints)} RP · ${number(rounds)}경기` : "일반전 시즌 기록을 표시합니다."}</p>
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
          <span>PERSONAL REPORT</span>
          <h2>{profile.name}의 플레이 리포트</h2>
          <p>최근 경기 {profile.recentMatches.length}개를 기준으로 플레이 성향과 맞춤 장비를 분석했습니다. 표본 충족도 {reportConfidence}%.</p>
        </section>

        <section className="player-report-facts" aria-label="최근 플레이 핵심 지표">
          <div><span>교전</span><strong>{number(recent.kills, 1)}킬 · ADR {number(recent.damage, 0)}</strong></div>
          <div><span>헤드샷 비중</span><strong>{ratio(recentKills ? recentHeadshots / recentKills : 0)}</strong></div>
          <div><span>팀 기여</span><strong>경기당 {number(teamActions / recentGames, 1)}회</strong></div>
          <div><span>평균 이동</span><strong>{number(recent.movement / 1000, 1)}km</strong></div>
        </section>

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
          <article className="trend-card">
            <span>RECENT FORM</span>
            <h2>최근 경기 흐름</h2>
            <div>
              <p>평균 킬 <strong>{number(recent.kills - previous.kills, 1)}</strong></p>
              <p>평균 피해 <strong>{number(recent.damage - previous.damage, 1)}</strong></p>
              <p>평균 순위 <strong>{number(recent.placement, 1)}위</strong></p>
            </div>
            <small>최근 5경기와 그 이전 5경기를 비교한 값입니다.</small>
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
                <article key={match.id}>
                  <div>
                    <span>{mapNames[match.mapName] ?? match.mapName}</span>
                    <strong>#{match.placement || "—"}</strong>
                  </div>
                  <p>{modeNames[match.gameMode] ?? match.gameMode}</p>
                  <dl>
                    <div><dt>킬</dt><dd>{match.kills}</dd></div>
                    <div><dt>피해량</dt><dd>{number(match.damage, 0)}</dd></div>
                    <div><dt>생존</dt><dd>{time(match.survivalSeconds)}</dd></div>
                    <div><dt>헤드샷</dt><dd>{match.headshotKills}</dd></div>
                    <div><dt>최장 킬</dt><dd>{number(match.longestKill, 0)}m</dd></div>
                    <div><dt>이동</dt><dd>{number((match.walkDistance + match.rideDistance) / 1000, 1)}km</dd></div>
                  </dl>
                  <time dateTime={match.createdAt}>
                    {match.createdAt ? new Date(match.createdAt).toLocaleDateString("ko-KR") : "날짜 없음"}
                  </time>
                </article>
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
