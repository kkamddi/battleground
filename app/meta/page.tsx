import SiteFooter from "../../components/SiteFooter";
import SiteHeader from "../../components/SiteHeader";

const metrics = [
  ["총기 사용률", "한 발 이상 발사한 플레이어 비율"],
  ["킬 점유율", "총기 킬 중 해당 무기가 차지한 비율"],
  ["파츠 장착률", "총기별 파츠 장착·최종 장착 비율"],
  ["패치 전후", "적용 전후 7일·30일 변화 비교"],
];

export default function MetaPage() {
  return (
    <main>
      <SiteHeader />
      <div className="page-shell subpage-shell">
        <header className="page-heading">
          <span>META DATA</span>
          <h1>메타</h1>
          <p>전체 PUBG 이용자 통계가 아닌, 공식 API에서 수집한 표본 매치 안의 변화를 분석합니다.</p>
        </header>
        <div className="status-panel">
          <span>현재 상태</span><strong>수집 파이프라인 준비 중</strong>
          <p>표본과 계산 기준이 충분해질 때까지 임의 수치는 공개하지 않습니다.</p>
        </div>
        <section className="metric-plan">
          {metrics.map(([name, description], index) => (
            <article key={name}><span>0{index + 1}</span><h2>{name}</h2><p>{description}</p></article>
          ))}
        </section>
        <section className="method-box">
          <h2>공개 시 함께 표시할 정보</h2>
          <div><span>수집 기간</span><span>표본 매치·플레이어 수</span><span>플랫폼과 모드</span><span>맵</span><span>갱신 시각</span></div>
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
