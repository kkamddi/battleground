import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PUBG 총기 도감",
  description: "PUBG 전체 총기의 피해량, RPM, 탄속, 탄창과 최근 밸런스 변경 이력을 한눈에 비교하세요.",
  alternates: { canonical: "/weapons" },
};

export default function WeaponsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
