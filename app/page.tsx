const patchChanges = [
  {
    type: "상향",
    tone: "up",
    title: "SLR 수평 반동 감소",
    value: "약 10%",
    description: "지속 사격 중 좌측으로 흐르는 성향이 감소했습니다.",
  },
  {
    type: "상향",
    tone: "up",
    title: "SLR 탄속 증가",
    value: "840 → 870 m/s",
    description: "중·장거리 이동 표적 대응이 개선되었습니다.",
  },
  {
    type: "삭제",
    tone: "removed",
    title: "월드 스폰 무기 정리",
    value: "6종",
    description: "Mosin Nagant, R45, DP-28 등 일부 무기가 제외됩니다.",
  },
];

const weaponRows = [
  { rank: 1, name: "M416", category: "AR", usage: "18.7%", delta: "+1.8%p", kills: "16.2%" },
  { rank: 2, name: "AUG", category: "AR", usage: "15.4%", delta: "+0.7%p", kills: "15.9%" },
  { rank: 3, name: "Beryl M762", category: "AR", usage: "12.9%", delta: "-0.4%p", kills: "14.1%" },
  { rank: 4, name: "SLR", category: "DMR", usage: "9.8%", delta: "+2.3%p", kills: "10.6%" },
];

const recommendations = [
  { eyebrow: "초보자 추천", title: "M416 안정형", copy: "보정기 · 수직 손잡이 · 전술 개머리판", tag: "반동 제어" },
  { eyebrow: "중거리 추천", title: "AUG 3배율 연사", copy: "보정기 · 하프 그립 · 확장 퀵드로우", tag: "중거리" },
  { eyebrow: "장거리 추천", title: "SLR 정밀 사격", copy: "보정기 · 칙패드 · 6배율", tag: "단발" },
];

function ArrowIcon() {
  return <span aria-hidden="true">↗</span>;
}

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="LOOKDOWN 홈">
          <span className="brand-mark">L</span>
          <span>LOOKDOWN</span>
        </a>
        <nav aria-label="주요 메뉴">
          <a href="#patch">패치노트</a>
          <a href="#weapons">총기 도감</a>
          <a href="#meta">메타 통계</a>
          <a href="#recommend">추천 파츠</a>
        </nav>
        <button className="search-button" type="button" aria-label="검색">
          <span>총기 검색</span>
          <kbd>⌘ K</kbd>
        </button>
      </header>

      <section className="hero" id="top">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-copy">
          <p className="kicker"><span /> UPDATE 42.1 LIVE</p>
          <h1>
            패치는 짧게,
            <br />
            <em>메타는 깊게.</em>
          </h1>
          <p className="hero-description">
            공식 패치노트부터 총기 스펙, 표본 매치 기반 사용률과
            추천 파츠까지. 전장의 변화를 숫자로 확인하세요.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#patch">이번 패치 보기 <ArrowIcon /></a>
            <a className="text-link" href="#weapons">총기 비교하기 <span>→</span></a>
          </div>
        </div>
        <div className="version-panel">
          <div className="version-topline">
            <span>현재 라이브 버전</span>
            <span className="live-dot">LIVE</span>
          </div>
          <strong>42.1</strong>
          <div className="date-row">
            <div><span>PC 적용</span><b>2026.06.17</b></div>
            <div><span>CONSOLE 적용</span><b>2026.06.25</b></div>
          </div>
          <p>공식 패치노트를 바탕으로 작성된 요약 정보입니다.</p>
        </div>
      </section>

      <section className="content-section" id="patch">
        <div className="section-heading">
          <div>
            <p className="section-kicker">PATCH BREAKDOWN</p>
            <h2>이번 패치 핵심</h2>
          </div>
          <a href="#patch">전체 패치노트 <ArrowIcon /></a>
        </div>
        <div className="patch-grid">
          {patchChanges.map((change, index) => (
            <article className="patch-card" key={change.title}>
              <div className="card-index">0{index + 1}</div>
              <span className={`status ${change.tone}`}>{change.type}</span>
              <h3>{change.title}</h3>
              <strong>{change.value}</strong>
              <p>{change.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="meta-section" id="meta">
        <div className="section-heading light">
          <div>
            <p className="section-kicker">RECENT META · 7 DAYS</p>
            <h2>지금 전장에서 선택된 무기</h2>
          </div>
          <div className="filters" aria-label="현재 통계 필터">
            <span>PC</span><span>일반전</span><span>스쿼드 TPP</span>
          </div>
        </div>
        <div className="meta-layout">
          <div className="table-wrap" id="weapons">
            <div className="table-row table-head">
              <span>순위 / 총기</span><span>사용률</span><span>7일 변화</span><span>킬 점유율</span>
            </div>
            {weaponRows.map((weapon) => (
              <div className="table-row" key={weapon.name}>
                <div className="weapon-name">
                  <b>{String(weapon.rank).padStart(2, "0")}</b>
                  <span><strong>{weapon.name}</strong><small>{weapon.category}</small></span>
                </div>
                <strong>{weapon.usage}</strong>
                <span className={weapon.delta.startsWith("+") ? "positive" : "negative"}>{weapon.delta}</span>
                <strong>{weapon.kills}</strong>
              </div>
            ))}
          </div>
          <aside className="riser-card">
            <p>가장 빠르게 상승 중</p>
            <div className="riser-rank">#04</div>
            <span className="weapon-type">DMR</span>
            <h3>SLR</h3>
            <div className="riser-stat">
              <span>사용률 변화</span>
              <strong>+2.3<small>%p</small></strong>
            </div>
            <p className="riser-copy">42.1 상향 이후 수집 표본에서 가장 큰 상승 폭을 보였습니다.</p>
          </aside>
        </div>
        <p className="data-note">
          예시 데이터 · 실제 API 연동 전 화면 검토용입니다. 공개 시 수집 기간, 표본 매치 수,
          플랫폼, 모드와 마지막 갱신 시각을 함께 표시합니다.
        </p>
      </section>

      <section className="content-section recommendations" id="recommend">
        <div className="section-heading">
          <div>
            <p className="section-kicker">LOADOUT GUIDE</p>
            <h2>목적에 맞는 파츠 조합</h2>
          </div>
          <a href="#recommend">추천 기준 보기 <ArrowIcon /></a>
        </div>
        <div className="recommend-grid">
          {recommendations.map((item, index) => (
            <article className="recommend-card" key={item.title}>
              <span className="recommend-number">{index + 1}</span>
              <p>{item.eyebrow}</p>
              <h3>{item.title}</h3>
              <div className="attachment-line" aria-hidden="true">
                <span /><i /><span /><i /><span />
              </div>
              <p className="loadout">{item.copy}</p>
              <span className="tag">{item.tag}</span>
            </article>
          ))}
        </div>
      </section>

      <footer>
        <a className="brand footer-brand" href="#top"><span className="brand-mark">L</span><span>LOOKDOWN</span></a>
        <p>비공식 PUBG 정보 서비스입니다. KRAFTON 또는 PUBG의 공식 서비스가 아닙니다.</p>
        <div><a href="#top">데이터 출처</a><a href="#top">계산 기준</a><a href="#top">문의</a></div>
      </footer>
    </main>
  );
}
