import SiteFooter from "../../components/SiteFooter";
import SiteHeader from "../../components/SiteHeader";

const guideGroups = [
  { label: "START", title: "초보자 가이드", copy: "총기 선택, 탄약 구성과 기본 파츠부터 시작합니다.", items: ["입문용 AR", "반동 제어 순서", "기본 인벤토리"] },
  { label: "RANGE", title: "거리별 총기 조합", copy: "근거리·중거리·장거리 교전 방식에 맞춰 구성합니다.", items: ["SMG + DMR", "AR + SR", "맵별 조합"] },
  { label: "LOADOUT", title: "파츠 조합", copy: "한 가지 정답 대신 목적과 숙련도에 따라 비교합니다.", items: ["안정형", "중거리 연사형", "단발 정밀형"] },
  { label: "CALCULATOR", title: "DPS·TTK 계산", copy: "방어구와 거리에 따른 이론 피해를 같은 조건에서 비교합니다.", items: ["방어구별 필요 탄수", "거리별 TTK", "총기 비교"] },
];

export default function GuidesPage() {
  return (
    <main>
      <SiteHeader />
      <div className="page-shell subpage-shell">
        <header className="page-heading">
          <span>PLAY GUIDE</span>
          <h1>가이드</h1>
          <p>패치 버전과 근거가 확인되는 추천만 제공하고, 취향과 통계를 구분해 표시합니다.</p>
        </header>
        <section className="guide-grid">
          {guideGroups.map((guide) => (
            <article key={guide.title}>
              <span>{guide.label}</span><h2>{guide.title}</h2><p>{guide.copy}</p>
              <ul>{guide.items.map((item) => <li key={item}>{item}<b>준비 중</b></li>)}</ul>
            </article>
          ))}
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
