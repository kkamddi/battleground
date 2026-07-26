import SiteFooter from "../../components/SiteFooter";
import SiteHeader from "../../components/SiteHeader";

const guideGroups = [
  {
    label: "START",
    title: "입문 안정형",
    copy: "반동 제어와 탄 수급을 우선한 범용 조합입니다.",
    items: [["주무기", "M416"], ["보조무기", "미니14"], ["M416 파츠", "보정기 · 수직 손잡이 · 전술 개머리판"], ["권장 배율", "AR 2~3배 · DMR 4~6배"]],
  },
  {
    label: "CLOSE",
    title: "근거리 기동형",
    copy: "건물과 능선 안쪽에서 빠른 이동과 연사를 우선합니다.",
    items: [["주무기", "UMP 또는 MP5K"], ["보조무기", "미니14 또는 Mk12"], ["운용 거리", "50m 안쪽"], ["주의", "38.1 이후 비조준보다 견착·ADS 우선"]],
  },
  {
    label: "MID",
    title: "중거리 범용형",
    copy: "한 자리를 지키기보다 이동과 연속 교전을 함께 고려합니다.",
    items: [["주무기", "AUG 또는 M416"], ["보조무기", "미니14 또는 SLR"], ["AR 파츠", "보정기 · 수직/하프 그립"], ["운용", "짧은 연사 후 재조준"]],
  },
  {
    label: "LONG",
    title: "장거리 정밀형",
    copy: "초탄 정확도와 엄폐 교환을 중심으로 운용합니다.",
    items: [["주무기", "M416 또는 AUG"], ["보조무기", "Kar98k 또는 M24"], ["권장 배율", "4~8배"], ["운용", "사격 후 같은 위치에 오래 노출하지 않기"]],
  },
];

export default function GuidesPage() {
  return (
    <main>
      <SiteHeader />
      <div className="page-shell subpage-shell">
        <header className="page-heading">
          <span>PLAY GUIDE</span>
          <h1>플레이 가이드</h1>
          <p>총기군의 공식 역할과 최신 밸런스 변경을 기준으로 구성한 상황별 추천입니다.</p>
        </header>
        <section className="guide-grid">
          {guideGroups.map((guide) => (
            <article key={guide.title}>
              <span>{guide.label}</span><h2>{guide.title}</h2><p>{guide.copy}</p>
              <ul>{guide.items.map(([name, value]) => <li key={name}><span>{name}</span><b>{value}</b></li>)}</ul>
            </article>
          ))}
        </section>
        <section className="guide-formulas">
          <article><span>DPS</span><strong>기본 피해량 × RPM ÷ 60</strong><p>재장전과 명중률을 제외한 이론상 초당 피해량입니다.</p></article>
          <article><span>TTK</span><strong>(필요 탄수 - 1) × 60 ÷ RPM</strong><p>첫 탄이 즉시 적중한다고 가정하므로 필요 탄수에서 1을 뺍니다.</p></article>
          <article><span>실전 보정</span><strong>방어구 · 거리 · 피격 부위</strong><p>실제 피해와 TTK는 방어구, 거리별 감소와 팔·다리 피격에 따라 달라집니다.</p></article>
        </section>
        <section className="guide-source">
          <p>추천 조합은 BGI 편집 기준이며 유일한 정답이 아닙니다. SMG는 공식 분류상 근거리·기동성 무기, DMR은 중거리 이상, SR은 장거리 특화 무기입니다.</p>
          <div>
            <a href="https://pubg.com/ko/game-info/weapons/ar" target="_blank" rel="noreferrer">공식 무기 분류 ↗</a>
            <a href="https://www.pubg.com/ko/news/9273?category=patch_notes" target="_blank" rel="noreferrer">38.1 건 플레이 변경 ↗</a>
          </div>
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
