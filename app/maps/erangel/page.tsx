import type { Metadata } from "next";
import PubgMapExplorer from "../../../components/PubgMapExplorer";
import SiteHeader from "../../../components/SiteHeader";

export const metadata: Metadata = {
  title: "에란겔 지도",
  description: "에란겔 일반전·경쟁전 차량, 보트, 차고지, 글라이더와 비밀 공간 위치를 확인하세요.",
};

export default function ErangelMapPage() {
  return <main><SiteHeader /><PubgMapExplorer mapSlug="erangel" /></main>;
}
