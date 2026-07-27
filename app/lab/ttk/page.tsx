import type { Metadata } from "next";
import SiteFooter from "../../../components/SiteFooter";
import SiteHeader from "../../../components/SiteHeader";
import TtkCalculator from "../../calculator/TtkCalculator";

export const metadata: Metadata = {
  title: "PUBG 거리·방어구별 TTK 계산",
  description: "PUBG 총기의 거리별 피해 감소와 방탄복별 필요 탄수, 이론상 TTK를 비교합니다.",
  alternates: { canonical: "/lab/ttk" },
};

export default function TtkPage() {
  return <main><SiteHeader /><div className="page-shell subpage-shell">
    <header className="page-heading"><span>LAB 01 · ESTIMATED COMBAT</span><h1>TTK·피해량 계산</h1><p>총기 두 개를 선택해 거리별 몸샷 피해량, 필요 탄수와 이론상 처치 시간을 비교합니다.</p></header>
    <TtkCalculator />
  </div><SiteFooter /></main>;
}
