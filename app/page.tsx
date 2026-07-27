import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";
import PlayerSearchForm from "../components/PlayerSearchForm";

const weaponImageBase =
  "https://wstatic-prod.pubg.com/web/live/static/game-info/weapons/images/viewer";

const recentPatches = [
  { version: "42.2", date: "2026.07.14", title: "기본 훈련·월드맵 개편", summary: "17개 훈련 챕터와 솔로 데스매치", href: "/patch-notes" },
  { version: "42.1", date: "2026.06.16", title: "SLR 상향", summary: "탄속 증가와 수평 반동 감소", href: "/patch-notes" },
  { version: "41.2", date: "2026.05.12", title: "신규 모드와 시스템 개선", summary: "PAYDAY 모드 및 서비스 업데이트", href: "/patch-notes" },
];

const featuredWeapons = [
  { name: "M416", type: "AR · 5.56mm", image: "m416", note: "현재 성능 변경 없음" },
  { name: "AUG", type: "AR · 5.56mm", image: "aug_a3", note: "현재 성능 변경 없음" },
  { name: "SLR", type: "DMR · 7.62mm", image: "slr", note: "42.1 상향" },
  { name: "Beryl M762", type: "AR · 7.62mm", image: "beryl_m762", note: "현재 성능 변경 없음" },
];

export default function Home() {
  return (
    <main>
      <SiteHeader />
      <div className="page-shell home-shell">
        <section className="home-lead">
          <div>
            <div className="eyebrow-row">
              <span className="live-badge">LIVE</span>
              <span>UPDATE 42.2</span>
              <span>PC 07.15 · CONSOLE 07.23</span>
            </div>
            <h1>나의 PUBG<br />플레이 리포트</h1>
            <p>플레이 스타일 · 주력 무기 · 파츠 성향 · 맞춤 추천</p>
          </div>
          <a className="lead-action" href="/patch-notes">
            <span>최신 패치</span>
            <strong>42.2</strong>
            <p>17개 훈련 챕터 · 월드맵 개편</p>
            <b>요약 보기 →</b>
          </a>
        </section>

        <section className="home-player-search">
          <div>
            <span>PLAYER SEARCH</span>
            <h2>닉네임으로 바로 보는 PUBG 전적 리포트</h2>
            <p>최근 최대 32경기의 전적, 플레이 스타일, 맵별 성과, 주력 무기와 파츠, 맞춤 추천을 한 번에 확인하세요.</p>
          </div>
          <div className="home-player-search-actions">
            <PlayerSearchForm />
            <a href="/players">Steam·Kakao 경쟁전 상위 플레이어 보기 →</a>
          </div>
        </section>

        <section className="home-section">
          <div className="home-section-head">
            <div><span>RECENT PATCHES</span><h2>최근 패치노트</h2></div>
            <a href="/patch-notes">전체 보기 →</a>
          </div>
          <div className="recent-patch-list">
            {recentPatches.map((patch) => (
              <a href={patch.href} key={patch.version}>
                <span>{patch.date}</span>
                <strong>{patch.version}</strong>
                <div><h3>{patch.title}</h3><p>{patch.summary}</p></div>
                <b>→</b>
              </a>
            ))}
          </div>
        </section>

        <section className="home-section">
          <div className="home-section-head">
            <div><span>WEAPON INDEX</span><h2>총기 빠르게 보기</h2></div>
            <a href="/weapons">48종 전체 보기 →</a>
          </div>
          <div className="featured-weapons">
            {featuredWeapons.map((weapon) => (
              <a href="/weapons" key={weapon.name}>
                <div className="weapon-image">
                  <img src={`${weaponImageBase}/img-weapons-${weapon.image}.webp`} alt={`${weapon.name} 총기`} />
                </div>
                <span>{weapon.type}</span>
                <h3>{weapon.name}</h3>
                <p>{weapon.note}</p>
              </a>
            ))}
          </div>
        </section>

        <section className="home-destinations">
          <a href="/meta">
            <span>DATA</span><h2>메타 통계</h2>
            <p>공식 API 표본으로 총기 사용률, 킬 점유율과 파츠 장착률을 분석합니다.</p>
            <b>준비 현황 보기 →</b>
          </a>
          <a href="/guides">
            <span>GUIDE</span><h2>플레이 가이드</h2>
            <p>초보자, 교전 거리와 반동 제어 방식에 맞는 총기·파츠 조합을 정리합니다.</p>
            <b>가이드 구성 보기 →</b>
          </a>
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
