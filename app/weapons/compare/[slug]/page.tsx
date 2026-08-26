import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteFooter from "../../../../components/SiteFooter";
import SiteHeader from "../../../../components/SiteHeader";
import { weapons } from "../../../../lib/catalog";
import { findWeaponComparison, weaponComparisons } from "../../../../lib/weaponComparisons";

export function generateStaticParams() {
  return weaponComparisons.map((comparison) => ({ slug: comparison.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const comparison = findWeaponComparison(slug);
  if (!comparison) return { title: "배그 총기 비교" };
  const left = weapons.find((weapon) => weapon.slug === comparison.leftSlug);
  const right = weapons.find((weapon) => weapon.slug === comparison.rightSlug);
  const title = `${left?.name} vs ${right?.name} 스펙·DPS 비교`;
  return {
    title,
    description: `${left?.name}와 ${right?.name}의 피해량, RPM, 이론 DPS, 탄속과 탄창을 비교하고 상황별 선택 기준을 확인하세요.`,
    alternates: { canonical: `/weapons/compare/${slug}` },
    openGraph: { title, description: comparison.summary, url: `/weapons/compare/${slug}` },
  };
}

function dps(damage: number, rpm: number | null) {
  return rpm ? Math.round(damage * rpm / 60) : null;
}

export default async function WeaponComparePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const comparison = findWeaponComparison(slug);
  if (!comparison) notFound();
  const left = weapons.find((weapon) => weapon.slug === comparison.leftSlug);
  const right = weapons.find((weapon) => weapon.slug === comparison.rightSlug);
  if (!left || !right) notFound();

  const rows = [
    ["기본 피해량", left.damageDisplay, right.damageDisplay],
    ["RPM", left.rpm ?? "—", right.rpm ?? "—"],
    ["이론 DPS", dps(left.damage, left.rpm) ?? "—", dps(right.damage, right.rpm) ?? "—"],
    ["탄속", left.velocity ? `${left.velocity}m/s` : "—", right.velocity ? `${right.velocity}m/s` : "—"],
    ["기본 / 확장 탄창", `${left.magazine} / ${left.extendedMagazine ?? "—"}`, `${right.magazine} / ${right.extendedMagazine ?? "—"}`],
    ["탄약", left.ammo, right.ammo],
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${left.name} vs ${right.name} PUBG 총기 비교`,
    description: comparison.summary,
    mainEntityOfPage: `https://bgi.pwkor.com/weapons/compare/${slug}`,
    inLanguage: "ko-KR",
  };

  return (
    <main>
      <SiteHeader />
      <div className="page-shell subpage-shell">
        <header className="page-heading">
          <span>{comparison.eyebrow}</span>
          <h1>{left.name} vs {right.name}</h1>
          <p>{comparison.summary}</p>
        </header>

        <section className="weapon-detail-section">
          <div className="home-section-head"><div><span>BASE STAT COMPARISON</span><h2>기본 수치 비교</h2></div><p>현재 BGI 관리 스펙 기준</p></div>
          <div className="comparison-table">
            <div><span>항목</span><strong>{left.name}</strong><strong>{right.name}</strong></div>
            {rows.map(([label, leftValue, rightValue]) => <div key={label}><span>{label}</span><strong>{leftValue}</strong><strong>{rightValue}</strong></div>)}
          </div>
        </section>

        <section className="guide-grid">
          <article><span>{left.category} · {left.ammo}</span><h2>{left.name}가 맞는 경우</h2><p>{comparison.leftUse}</p><ul><li><span>총기 상세</span><b><a href={`/weapons/${left.slug}`}>{left.name} 스펙·파츠 보기 →</a></b></li></ul></article>
          <article><span>{right.category} · {right.ammo}</span><h2>{right.name}가 맞는 경우</h2><p>{comparison.rightUse}</p><ul><li><span>총기 상세</span><b><a href={`/weapons/${right.slug}`}>{right.name} 스펙·파츠 보기 →</a></b></li></ul></article>
        </section>

        <section className="weapon-detail-section">
          <div className="home-section-head"><div><span>BGI VERDICT</span><h2>어떤 총기를 선택할까?</h2></div></div>
          <p className="live-meta-note">{comparison.verdict}</p>
          <div className="data-source"><p><strong>계산 기준</strong> 이론 DPS = 기본 피해량 × RPM ÷ 60. 재장전, 거리별 피해 감소, 방어구, 명중률과 반동은 포함하지 않습니다.</p><p><a href="/lab/ttk">거리·방어구별 TTK 계산기로 확인하기 →</a></p></div>
        </section>
      </div>
      <SiteFooter />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </main>
  );
}
