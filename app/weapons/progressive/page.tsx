import type { Metadata } from "next";
import SiteFooter from "../../../components/SiteFooter";
import SiteHeader from "../../../components/SiteHeader";
import { progressiveCatalog } from "../../../data/progressiveCatalog";
import ProgressiveCatalog from "./ProgressiveCatalog";

export const metadata: Metadata = {
  title: "PUBG 성장형 스킨 도감",
  description: "역대 PUBG 성장형 스킨을 출시 시기와 적용 무기별로 검색합니다.",
  alternates: { canonical: "/weapons/progressive" },
};

export default function ProgressivePage() {
  return (
    <main>
      <SiteHeader />
      <div className="page-shell subpage-shell">
        <header className="page-heading">
          <span>WEAPON SKIN INDEX · PROGRESSIVE</span>
          <h1>성장형 스킨 도감</h1>
          <p>역대 성장형 스킨을 적용 무기와 출시 시기 기준으로 정리했습니다.</p>
        </header>
        <ProgressiveCatalog skins={progressiveCatalog} />
        <aside className="calculation-notice">
          <strong>자료 기준</strong>
          <p>PUBG 공식 상점 공지를 우선 사용하며, 공식 원문을 추가 확인 중인 항목은 출시 목록만 표시합니다.</p>
        </aside>
      </div>
      <SiteFooter />
    </main>
  );
}

