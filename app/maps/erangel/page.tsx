import type { Metadata } from "next";
import PubgMapExplorer from "../../../components/PubgMapExplorer";
import SiteHeader from "../../../components/SiteHeader";

export const metadata: Metadata = {
  title: "에란겔 차고지·차량·보트·글라이더 위치",
  description: "에란겔의 차고지, 고정 차량, 보트, 글라이더와 비밀의 방 위치를 카테고리별로 확인하는 BGI 인터랙티브 지도입니다.",
};

export default function ErangelMapPage() {
  return (
    <main className="map-page">
      <SiteHeader />
      <PubgMapExplorer />
    </main>
  );
}

