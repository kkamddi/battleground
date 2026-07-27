import type { Metadata } from "next";
import PlayerSearchForm from "../../components/PlayerSearchForm";
import SiteFooter from "../../components/SiteFooter";
import SiteHeader from "../../components/SiteHeader";
import {
  getLeaderboard,
  LeaderboardPlayer,
  PubgPlatform,
} from "../../lib/pubg";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "PUBG 전적 검색·경쟁전 랭킹",
  description: "Steam·Kakao PUBG 닉네임 전적 검색과 경쟁전 상위 플레이어의 최근 무기·파츠 리포트를 확인하세요.",
};

async function loadLeaderboard(platform: PubgPlatform) {
  try {
    const tpp = await getLeaderboard(platform, "squad");
    if (tpp.length) return { players: tpp, mode: "스쿼드 TPP" };
  } catch {}

  try {
    return { players: await getLeaderboard(platform, "squad-fpp"), mode: "스쿼드 FPP" };
  } catch {
    return { players: [] as LeaderboardPlayer[], mode: "스쿼드" };
  }
}

function number(value: number, digits = 0) {
  return value.toLocaleString("ko-KR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

function Leaderboard({
  platform,
  players,
  mode,
}: {
  platform: PubgPlatform;
  players: LeaderboardPlayer[];
  mode: string;
}) {
  const platformName = platform === "kakao" ? "Kakao" : "Steam";

  return (
    <section className="ranker-board">
      <div className="ranker-board-head">
        <div>
          <span className={`platform-mark ${platform}`}>{platform === "kakao" ? "K" : "S"}</span>
          <div>
            <h2>{platformName} 경쟁전 TOP 10</h2>
            <p>현재 시즌 · {mode}</p>
          </div>
        </div>
        <span>2시간마다 갱신</span>
      </div>
      <div className="ranker-table-head">
        <span>#</span><span>플레이어</span><span>RP</span><span>K/D</span><span>ADR</span>
      </div>
      <div className="ranker-list">
        {players.length ? players.map((player) => (
          <a
            href={`/player/${platform}/${encodeURIComponent(player.name)}`}
            key={player.accountId}
            title={`${player.name}의 무기·파츠 리포트 보기`}
          >
            <strong>{player.rank}</strong>
            <span>{player.name}</span>
            <span>{number(player.rankPoints)} RP</span>
            <span>{number(player.kd, 2)}</span>
            <span>{number(player.averageDamage, 0)}</span>
          </a>
        )) : (
          <p className="ranker-empty">현재 리더보드를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.</p>
        )}
      </div>
    </section>
  );
}

export default async function PlayersPage() {
  const [steam, kakao] = await Promise.all([
    loadLeaderboard("steam"),
    loadLeaderboard("kakao"),
  ]);

  return (
    <main>
      <SiteHeader />
      <div className="page-shell players-shell">
        <section className="players-heading">
          <span>PLAYER SEARCH</span>
          <h1>전적 검색</h1>
          <p>게임 내 닉네임으로 최근 전적, 플레이 스타일, 킬 무기와 자주 쓰는 파츠를 확인합니다.</p>
          <div className="players-search-box">
            <PlayerSearchForm />
          </div>
        </section>

        <section className="ranker-intro">
          <div>
            <span>OFFICIAL LEADERBOARD</span>
            <h2>경쟁전 상위 플레이어</h2>
          </div>
          <p>플레이어를 선택하면 최근 경기에서 확인된 총기와 파츠 조합까지 BGI 리포트로 연결됩니다.</p>
        </section>

        <div className="ranker-grid">
          <Leaderboard platform="steam" players={steam.players} mode={steam.mode} />
          <Leaderboard platform="kakao" players={kakao.players} mode={kakao.mode} />
        </div>

        <p className="ranker-note">
          순위와 시즌 기록은 PUBG 공식 API 기준입니다. 총기·파츠 리포트는 최근 14일 내 확인 가능한 경기 텔레메트리를 BGI가 분석한 결과이며, 경기 수에 따라 표본이 달라질 수 있습니다.
        </p>
      </div>
      <SiteFooter />
    </main>
  );
}
