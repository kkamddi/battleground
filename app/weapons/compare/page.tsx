import type { Metadata } from "next";
import SiteFooter from "../../../components/SiteFooter";
import SiteHeader from "../../../components/SiteHeader";
import { weapons } from "../../../lib/catalog";
import { weaponComparisons } from "../../../lib/weaponComparisons";

export const metadata: Metadata = {
  title: "배그 총기 비교 | M416·AUG·베릴·ACE32",
  description: "PUBG 인기 총기의 피해량, RPM, DPS, 탄속과 탄창을 1대1로 비교하고 상황별 선택 기준을 확인하세요.",
  alternates: { canonical: "/weapons/compare" },
};

export default function WeaponCompareIndexPage() {
  return (
    <main>
      <SiteHeader />
      <div className="page-shell subpage-shell">
        <header className="page-heading">
          <span>WEAPON HEAD-TO-HEAD · UPDATE 42.3</span>
          <h1>총기 1:1 비교</h1>
          <p>피해량, 연사 속도, 이론 DPS와 탄속을 같은 기준으로 비교합니다. 실제 성능은 반동 숙련도와 파츠, 교전 거리에 따라 달라집니다.</p>
        </header>
        <section className="lab-index">
          {weaponComparisons.map((comparison, index) => {
            const left = weapons.find((weapon) => weapon.slug === comparison.leftSlug);
            const right = weapons.find((weapon) => weapon.slug === comparison.rightSlug);
            return (
              <a href={`/weapons/compare/${comparison.slug}`} key={comparison.slug}>
                <span>{String(index + 1).padStart(2, "0")} · {comparison.eyebrow}</span>
                <h2>{left?.name} vs {right?.name}</h2>
                <p>{comparison.summary}</p>
                <b>수치와 선택 기준 보기 →</b>
              </a>
            );
          })}
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
