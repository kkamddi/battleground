import SiteFooter from "../../components/SiteFooter";
import SiteHeader from "../../components/SiteHeader";

const patches = [
  { version: "42.2", date: "2026.07.14", pc: "07.15", console: "07.23", title: "기본 훈련 전면 개편", points: ["17개 훈련 챕터와 초심자 훈련소", "태이고·론도 비밀의 방 스폰 변경", "총기 기본 성능 변경 없음"], url: "https://www.pubg.com/ko/news/10459" },
  { version: "42.1", date: "2026.06.16", pc: "06.17", console: "06.25", title: "SLR 상향과 월드 스폰 정리", points: ["SLR 탄속 840 → 870m/s", "수평 반동 약 10% 감소", "일부 무기 월드 스폰 제외"], url: "https://www.pubg.com/ko/news/10179" },
  { version: "41.2", date: "2026.05.12", pc: "05.13", console: "05.21", title: "PAYDAY 모드와 시스템 업데이트", points: ["PAYDAY 신규 모드", "게임 플레이 및 서비스 개선", "버그 수정"], url: "https://www.pubg.com/ko/news/10080" },
  { version: "41.1", date: "2026.04.08", pc: "04.08", console: "04.16", title: "시즌 업데이트와 무기 정리 예고", points: ["시즌 콘텐츠 업데이트", "42.1 무기 삭제 사전 안내", "맵 서비스 변경"], url: "https://www.pubg.com/ko/news/9926" },
  { version: "40.2", date: "2026.03.10", pc: "03.11", console: "03.19", title: "PUBG 9주년 업데이트", points: ["9주년 콘텐츠", "월드 및 시스템 개선", "서비스 업데이트"], url: "https://www.pubg.com/ko/news/9809" },
  { version: "40.1", date: "2026.02.03", pc: "02.04", console: "02.12", title: "Mk12 하향·SLR 상향", points: ["Mk12 피해량 44 → 43", "Mk12 수평 반동 8% 증가", "SLR 수평 반동 4% 감소"], url: "https://www.pubg.com/ko/news/9690" },
  { version: "39.2", date: "2026.01.06", pc: "01.07", console: "01.15", title: "에란겔: 서브제로 심화", points: ["위성체와 특수 내열 수트", "론도 스폰 재조정", "PC 2차 비밀번호"], url: "https://www.pubg.com/ko/news/9635" },
  { version: "39.1", date: "2025.12.02", pc: "12.03", console: "12.11", title: "에란겔: 서브제로", points: ["겨울 에란겔 시즈널 변화", "신규 월드 피처", "시즌 콘텐츠"], url: "https://www.pubg.com/ko/news/9466?category=patch_notes" },
];

export default function PatchNotesPage() {
  return (
    <main>
      <SiteHeader />
      <div className="page-shell subpage-shell">
        <header className="page-heading">
          <span>PATCH ARCHIVE</span>
          <h1>패치노트</h1>
          <p>PUBG 공식 PC·콘솔 패치노트에서 플레이에 영향을 주는 내용만 버전별로 정리합니다.</p>
        </header>
        <section className="patch-archive">
          {patches.map((patch, index) => (
            <article className={index === 0 ? "current" : ""} key={patch.version}>
              <div className="patch-version">
                {index === 0 && <span>LIVE</span>}
                <strong>{patch.version}</strong>
                <p>{patch.date}</p>
              </div>
              <div className="patch-details">
                <h2>{patch.title}</h2>
                <ul>{patch.points.map((point) => <li key={point}>{point}</li>)}</ul>
              </div>
              <div className="patch-dates">
                <p><span>PC</span>{patch.pc}</p>
                <p><span>CONSOLE</span>{patch.console}</p>
                <a href={patch.url} target="_blank" rel="noreferrer">공식 원문 ↗</a>
              </div>
            </article>
          ))}
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
