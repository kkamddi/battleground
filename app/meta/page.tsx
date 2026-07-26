import type { Metadata } from "next";
import SiteFooter from "../../components/SiteFooter";
import SiteHeader from "../../components/SiteHeader";

export const metadata: Metadata = {
  title: "PUBG 시즌 42 메타 통계",
  description: "PUBG 시즌 42 텔레메트리 표본의 총기별 킬 점유율, 헤드샷 비율과 평균 교전 거리를 확인하세요.",
  alternates: { canonical: "/meta" },
};

const currentMeta = [
  { rank: 1, name: "AUG", share: "13.1%", kills: "172.2K", headshot: "26%", distance: "32m" },
  { rank: 2, name: "M416", share: "9.5%", kills: "124.0K", headshot: "22%", distance: "29m" },
  { rank: 3, name: "MP5K", share: "7.8%", kills: "101.6K", headshot: "17%", distance: "20m" },
  { rank: 4, name: "Beryl M762", share: "7.6%", kills: "99.7K", headshot: "24%", distance: "26m" },
  { rank: 5, name: "ACE32", share: "6.7%", kills: "88.2K", headshot: "24%", distance: "27m" },
  { rank: 6, name: "M24", share: "6.4%", kills: "84.2K", headshot: "45%", distance: "114m" },
  { rank: 7, name: "UMP45", share: "5.2%", kills: "67.6K", headshot: "19%", distance: "22m" },
  { rank: 8, name: "AKM", share: "5.0%", kills: "65.7K", headshot: "24%", distance: "25m" },
];

export default function MetaPage() {
  return (
    <main>
      <SiteHeader />
      <div className="page-shell subpage-shell">
        <header className="page-heading">
          <span>META DATA</span>
          <h1>시즌 42 메타 통계</h1>
          <p>42.2 라이브 시점의 시즌 42 누적 킬을 기준으로 총기 점유율과 교전 특성을 비교합니다.</p>
        </header>
        <div className="status-panel">
          <span>외부 텔레메트리 표본</span><strong>시즌 42 · 42.2 라이브 시점</strong>
          <p>2026.07.26 조회 · 추적된 킬 1,311,521건 · 원본 서비스는 5분 주기 갱신</p>
        </div>
        <section className="meta-stat-grid">
          {currentMeta.slice(0, 4).map((stat) => (
            <article key={stat.name}>
              <span>#{stat.rank} · {stat.name}</span>
              <div><small>킬 점유율</small><strong>{stat.share}</strong></div>
              <b>·</b>
              <div><small>기록된 킬</small><strong>{stat.kills}</strong></div>
              <p>HS {stat.headshot} · 평균 {stat.distance}</p>
            </article>
          ))}
        </section>
        <section className="meta-detail">
          <div>
            <span>현재 표본 요약</span>
            <h2>AUG가 킬 점유율 13.1%로 선두</h2>
            <p>AUG와 M416이 상위 두 자리를 차지했고, MP5K와 Beryl M762가 뒤를 이었습니다. 이 수치는 획득률이 아니라 추적 매치에서 해당 수단으로 발생한 전체 킬의 비중입니다.</p>
            <a href="https://www.pubg.army/de/weapons" target="_blank" rel="noreferrer">시즌 42 텔레메트리 원문 ↗</a>
          </div>
          <dl>
            {currentMeta.slice(4).map((stat) => (
              <div key={stat.name}><dt>#{stat.rank} {stat.name}</dt><dd>{stat.share} · {stat.kills}</dd></div>
            ))}
          </dl>
        </section>
        <section className="method-box">
          <h2>표본 통계 안내</h2>
          <p>PUBG.ARMY가 수집한 시즌 42 매치의 킬 텔레메트리 스냅샷입니다. 전체 PUBG 이용자나 특정 지역·모드의 모집단 통계가 아니며, 수집 범위에 따라 편향될 수 있습니다.</p>
          <div><span>시즌 42 누적</span><span>킬 1,311,521건</span><span>외부 수집 표본</span><span>42.2 라이브 시점</span><span>조회 2026.07.26</span></div>
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
