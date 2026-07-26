import type { Metadata } from "next";
import SiteFooter from "../../components/SiteFooter";
import SiteHeader from "../../components/SiteHeader";
import ApprovedPatchFeed from "./ApprovedPatchFeed";

export const metadata: Metadata = {
  title: "PUBG 패치노트",
  description: "PUBG PC·콘솔 공식 패치노트의 총기, 맵, 시스템 핵심 변경사항을 버전별로 확인하세요.",
  alternates: { canonical: "/patch-notes" },
};

const patches = [
  { version: "42.2", date: "2026.07.14", pc: "07.15", console: "07.23", title: "기본 훈련·월드맵 개편", points: ["기본 훈련 17개 챕터·초보자 훈련장 추가", "태이고·론도 비밀의 방 총기 구성 변경", "월드맵에 지도·미션·매치 로그 탭 추가", "솔로 데스매치 기간 한정 운영"], url: "https://www.pubg.com/ko/news/10459" },
  { version: "42.1", date: "2026.06.16", pc: "06.17", console: "06.25", title: "SLR 상향과 무기 6종 삭제", points: ["SLR 탄속 840 → 870m/s", "SLR 수평 반동 10% 감소", "SLR 초·중반 수직 반동 증가량 완화", "모신 나강·R45·DP-28·비존·P1911·QBU 삭제"], url: "https://www.pubg.com/ko/news/10179" },
  { version: "41.2", date: "2026.05.12", pc: "05.13", console: "05.21", title: "PAYDAY·미라마 업데이트", points: ["PAYDAY 컬래버레이션 모드", "미라마 비밀의 방 추가", "근접 무기 처형 모션 추가", "블루칩 송신기 보급 호출 조건 조정"], url: "https://www.pubg.com/ko/news/10080" },
  { version: "41.1", date: "2026.04.08", pc: "04.08", console: "04.16", title: "신규 부착물·그립 밸런스", points: ["1배율·4배율 전환 하이브리드 스코프 추가", "틸티드 그립 추가·앵글 손잡이 삭제", "하프 그립 수평 반동 제어 8% → 16%", "드라구노프 수직 반동 20%·수평 반동 15% 감소"], url: "https://www.pubg.com/ko/news/9926" },
  { version: "40.2", date: "2026.03.10", pc: "03.11", console: "03.19", title: "PUBG 9주년 업데이트", points: ["9주년 콘텐츠", "월드 및 시스템 개선", "서비스 업데이트"], url: "https://www.pubg.com/ko/news/9809" },
  { version: "40.1", date: "2026.02.03", pc: "02.04", console: "02.12", title: "Mk12 하향·SLR 상향", points: ["Mk12 피해량 44 → 43", "Mk12 수평 반동 8% 증가", "SLR 수평 반동 4% 감소"], url: "https://www.pubg.com/ko/news/9690" },
  { version: "39.2", date: "2026.01.06", pc: "01.07", console: "01.15", title: "에란겔: 서브제로 심화", points: ["위성체와 특수 내열 수트", "론도 스폰 재조정", "PC 2차 비밀번호"], url: "https://www.pubg.com/ko/news/9635" },
  { version: "39.1", date: "2025.12.02", pc: "12.03", console: "12.11", title: "에란겔: 서브제로", points: ["겨울 에란겔 시즈널 변화", "신규 월드 피처", "시즌 콘텐츠"], url: "https://www.pubg.com/ko/news/9466?category=patch_notes" },
  { version: "38.2", date: "2025.11.04", pc: "11.05", console: "11.13", title: "론도 개편과 현세대 콘솔 전환", points: ["론도 마켓·필라 가드·BR 코인 제거", "Lo Hua Xing·Rin Jiang·Test Track 개편", "PS5·Xbox Series X|S 중심 콘솔 서비스 전환"], url: "https://www.pubg.com/ko/news/9356" },
  { version: "38.1", date: "2025.10.14", pc: "10.15", console: "10.23", title: "SMG 하향과 미라마 지형 파괴", points: ["P90 제외 SMG 비조준 정확도 57% 감소", "MP5K 피해량 34 → 32", "미라마 지형 파괴 기능과 곡괭이 추가"], url: "https://www.pubg.com/ko/news/9273?category=patch_notes" },
  { version: "37.2", date: "2025.09.09", pc: "09.10", console: "09.18", title: "미라마 지역 개편", points: ["Minas Generales 레이아웃·지형 개편", "자판기와 파괴 가능한 항아리 추가", "PUBG x G-DRAGON 월드 콘텐츠"], url: "https://www.pubg.com/ko/news/9087?category=patch_notes" },
  { version: "37.1", date: "2025.08.12", pc: "08.13", console: "08.21", title: "DMR 전면 리밸런스", points: ["DMR 피해량 약 12% 감소", "일부 예외를 제외한 DMR 발사 속도 약 45% 감소", "캔티드 사이트 전체 스폰 제거"], url: "https://www.pubg.com/ko/news/9002?category=patch_notes" },
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
        <ApprovedPatchFeed />
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
