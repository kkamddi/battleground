import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BGI — BattleGround Information",
    short_name: "BGI",
    description: "PUBG 패치노트, 총기 데이터, 메타 통계와 플레이 가이드.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f7f4",
    theme_color: "#171917",
    lang: "ko",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
