import type { Metadata } from "next";
import SiteFooter from "../../../../components/SiteFooter";
import SiteHeader from "../../../../components/SiteHeader";
import PlayerSearchForm from "../../../../components/PlayerSearchForm";
import { getPlayerProfile, PlayerModeStats, PubgApiError } from "../../../../lib/pubg";

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ nickname: string }>;
}): Promise<Metadata> {
  const { nickname } = await params;
  const decoded = decodeURIComponent(nickname);
  return {
    title: `${decoded} PUBG 전적`,
    description: `${decoded}의 PUBG 현재 시즌 경쟁전과 최근 매치 전적을 확인하세요.`,
  };
}

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ nickname: string }>;
}) {
  const { nickname } = await params;
  const decoded = decodeURIComponent(nickname);
  let profile = null;
  let error = "";
  try {
    profile = await getPlayerProfile(decoded);
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
            <p>{error || "Steam PUBG의 정확한 게임 내 닉네임을 확인해 주세요."}</p>
            <PlayerSearchForm />
          </section>
        </div>
        <SiteFooter />
      </main>
    );
  }

  const ranked = preferredMode(profile.rankedModes);
  const season = preferredMode(profile.seasonModes);
  const [modeKey, stats] = ranked ?? season ?? ["squad-fpp", {}];
  const rounds = Number(stats.roundsPlayed ?? 0);
  const wins = Number(stats.wins ?? 0);
  const kills = Number(stats.kills ?? 0);
  const deaths = Number(stats.deaths ?? Math.max(rounds - wins, 0));
  const kd = stats.kdr ?? (deaths ? kills / deaths : kills);
  const adr = rounds ? Number(stats.damageDealt ?? 0) / rounds : 0;

  return (
    <main>
      <SiteHeader />
      <div className="page-shell player-shell">
        <section className="player-heading">
          <div>
            <span>STEAM PUBG PLAYER</span>
            <h1>{profile.name}</h1>
            <p>현재 시즌 · {modeNames[modeKey] ?? modeKey}</p>
          </div>
          <PlayerSearchForm compact />
        </section>

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
          PUBG 공식 API의 Steam PC 데이터입니다. 최근 매치는 최대 10개를 표시하며 API 갱신 시점에 따라 게임 직후 기록이 늦게 보일 수 있습니다.
        </p>
      </div>
      <SiteFooter />
    </main>
  );
}
