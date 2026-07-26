import SiteFooter from "../../components/SiteFooter";
import SiteHeader from "../../components/SiteHeader";

const officialStats = [
  { name: "일반전 DMR 사용률", before: "16.3%", after: "10.5%", change: "-5.8%p" },
  { name: "경쟁전 DMR 사용률", before: "20.6%", after: "13.0%", change: "-7.6%p" },
  { name: "일반전 SR 사용률", before: "13.1%", after: "16.4%", change: "+3.3%p" },
  { name: "평균 교전 거리", before: "59.4m", after: "55.7m", change: "-3.7m" },
];

const matchImpact = [
  ["22분 시점 DMR 킬 비율", "26.9% → 18.6%"],
  ["22분 시점 SR 킬 비율", "12.7% → 17.6%"],
  ["업데이트 후 AR 피해 비율", "30.3%"],
  ["업데이트 후 DMR 피해 비율", "29.3%"],
  ["업데이트 후 SR 피해 비율", "27.6%"],
];

export default function MetaPage() {
  return (
    <main>
      <SiteHeader />
      <div className="page-shell subpage-shell">
        <header className="page-heading">
          <span>META DATA</span>
          <h1>메타 통계</h1>
          <p>PUBG가 공개한 건 플레이 지표와 향후 BGI 표본 통계를 출처별로 구분합니다.</p>
        </header>
        <div className="status-panel">
          <span>공식 공개 자료</span><strong>업데이트 37.1 전후 비교</strong>
          <p>2025년 8월 데이터 · PUBG 개발일지 2025.10.13 공개</p>
        </div>
        <section className="meta-stat-grid">
          {officialStats.map((stat) => (
            <article key={stat.name}>
              <span>{stat.name}</span>
              <div><small>전</small><strong>{stat.before}</strong></div>
              <b>→</b>
              <div><small>후</small><strong>{stat.after}</strong></div>
              <p>{stat.change}</p>
            </article>
          ))}
        </section>
        <section className="meta-detail">
          <div>
            <span>공식 분석</span>
            <h2>DMR 중심 장거리 교전에서 근접 교전으로 이동</h2>
            <p>DMR 사용률과 중후반 영향력이 낮아지고 SR 비중이 상승했습니다. 평균 교전 거리도 3.7m 감소해 장거리 대치보다 가까운 거리의 교전이 늘어난 것으로 분석됐습니다.</p>
            <a href="https://pubg.com/ko/news/9275" target="_blank" rel="noreferrer">공식 개발일지 원문 ↗</a>
          </div>
          <dl>
            {matchImpact.map(([name, value]) => (
              <div key={name}><dt>{name}</dt><dd>{value}</dd></div>
            ))}
          </dl>
        </section>
        <section className="method-box">
          <h2>BGI 실시간 표본 통계</h2>
          <p>현재 공식 API·텔레메트리 수집 파이프라인을 준비 중입니다. 수집 전에는 최신 사용률이나 파츠 점유율을 추정해 표시하지 않습니다.</p>
          <div><span>수집 기간</span><span>표본 매치·플레이어 수</span><span>플랫폼과 모드</span><span>맵</span><span>갱신 시각</span></div>
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
