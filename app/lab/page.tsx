import type { Metadata } from "next";
import SiteFooter from "../../components/SiteFooter";
import SiteHeader from "../../components/SiteHeader";

export const metadata: Metadata = {
  title: "PUBG 실험실",
  description: "거리·방어구별 TTK와 실전 파츠 조합을 한곳에서 확인합니다.",
  alternates: { canonical: "/lab" },
};

const tools = [
  { href: "/lab/ttk", code: "01", title: "TTK·피해량 계산", text: "거리와 방탄복 레벨에 따른 피해량, 필요 탄수와 이론상 TTK를 비교합니다." },
  { href: "/lab/loadouts", code: "02", title: "실전 파츠 조합", text: "킬 발생 당시 장착 파츠와 경쟁전 상위권 세팅을 총기별로 집계합니다." },
];

export default function LabPage() {
  return <main><SiteHeader /><div className="page-shell subpage-shell">
    <header className="page-heading"><span>BGI LABORATORY</span><h1>실험실</h1><p>단순 스펙을 넘어 실제 교전과 수집 데이터를 직접 비교하는 도구입니다.</p></header>
    <section className="lab-index">{tools.map((tool) => <a href={tool.href} key={tool.href}><span>{tool.code}</span><h2>{tool.title}</h2><p>{tool.text}</p><b>열기 →</b></a>)}</section>
  </div><SiteFooter /></main>;
}
