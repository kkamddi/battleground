"use client";

import { useState } from "react";
import SiteFooter from "../../components/SiteFooter";
import SiteHeader from "../../components/SiteHeader";
import { attachments, weaponImageBase, weapons } from "../../lib/catalog";

const categories = ["전체", "AR", "DMR", "SR", "LMG", "SMG", "SG", "HG", "ETC"];
const featuredNames = ["M416", "AUG", "SLR", "Beryl M762"];

function magazine(standard: number, extended: number | null) {
  return extended ? `${standard} / ${extended}` : String(standard);
}

export default function WeaponsPage() {
  const [activeCategory, setActiveCategory] = useState("전체");
  const [query, setQuery] = useState("");
  const featured = weapons.filter((weapon) => featuredNames.includes(weapon.name));
  const filtered = weapons.filter((weapon) => {
    const categoryMatch = activeCategory === "전체" || activeCategory === weapon.category;
    return categoryMatch && weapon.name.toLowerCase().includes(query.trim().toLowerCase());
  });

  return (
    <main>
      <SiteHeader />
      <div className="page-shell subpage-shell">
        <header className="page-heading weapon-page-heading">
          <span>WEAPON &amp; ATTACHMENT INDEX · 42.2</span>
          <h1>총기 도감</h1>
          <p>현재 스펙, 최근 변경과 실전 파츠 조합을 총기 상세에서 함께 확인합니다. 총 {weapons.length}종.</p>
        </header>

        <section className="weapon-feature-grid">
          {featured.map((weapon) => (
            <a href={`/weapons/${weapon.slug}`} key={weapon.name}>
              <article>
                <div className="weapon-image"><img src={`${weaponImageBase}/img-weapons-${weapon.image}.webp`} alt={`${weapon.name} 총기`} /></div>
                <span>{weapon.category} · {weapon.ammo}</span>
                <h2>{weapon.name}</h2>
                <dl><div><dt>피해량</dt><dd>{weapon.damageDisplay}</dd></div><div><dt>RPM</dt><dd>{weapon.rpm ?? "—"}</dd></div><div><dt>탄속</dt><dd>{weapon.velocity ?? "—"}</dd></div></dl>
              </article>
            </a>
          ))}
        </section>

        <section className="weapon-catalog">
          <div className="weapon-toolbar">
            <div className="category-tabs">
              {categories.map((category) => (
                <button className={category === activeCategory ? "active" : ""} onClick={() => setActiveCategory(category)} type="button" key={category}>{category}</button>
              ))}
            </div>
            <label className="weapon-search" htmlFor="weapon-search"><span>검색</span><input id="weapon-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="총기명" /></label>
          </div>
          <div className="weapon-table-wrap">
            <table className="weapon-table">
              <thead><tr><th>총기</th><th>분류</th><th>탄약</th><th>피해량</th><th>RPM</th><th>탄속 m/s</th><th>탄창</th><th>최근 변경</th></tr></thead>
              <tbody>
                {filtered.map((weapon) => (
                  <tr key={weapon.key}>
                    <td><a className="weapon-name-cell" href={`/weapons/${weapon.slug}`}><span className="weapon-thumb"><img src={`${weaponImageBase}/img-weapons-${weapon.image}.webp`} alt="" /></span><strong>{weapon.name}</strong></a></td>
                    <td><span className="category-code">{weapon.category}</span></td>
                    <td>{weapon.ammo}</td><td>{weapon.damageDisplay}</td><td>{weapon.rpm ?? "—"}</td><td>{weapon.velocity ?? "—"}</td><td>{magazine(weapon.magazine, weapon.extendedMagazine)}</td>
                    <td>{weapon.change ? <span className={`change ${weapon.changeType}`}>{weapon.change}</span> : <span className="no-change">변경 없음</span>}</td>
                  </tr>
                ))}
                {!filtered.length && <tr><td className="empty-result" colSpan={8}>조건에 맞는 총기가 없습니다.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="data-source">
            <p><strong>이미지·분류</strong> PUBG 공식 PC·콘솔 게임 정보 페이지</p>
            <p><strong>수치 스펙</strong> 공개 자료와 공식 패치 이력을 교차 검증한 관리 데이터입니다. 게임 빌드와 차이가 있을 수 있습니다.</p>
          </div>
        </section>

        <section className="weapon-catalog attachment-index">
          <div className="home-section-head"><div><span>ATTACHMENT INDEX · 42.2</span><h2>파츠 도감</h2></div></div>
          <div className="weapon-table-wrap">
            <table className="weapon-table">
              <thead><tr><th>파츠</th><th>분류</th><th>호환 범위</th><th>핵심 효과</th><th>추천 용도</th><th>최근 변경</th></tr></thead>
              <tbody>{attachments.map((attachment) => (
                <tr key={attachment.key}><td><strong>{attachment.name}</strong></td><td><span className="category-code">{attachment.category}</span></td><td>{attachment.compatible}</td><td>{attachment.effect}</td><td>{attachment.recommendedFor.join(" · ")}</td><td><span className="change spawn">{attachment.change}</span></td></tr>
              ))}</tbody>
            </table>
          </div>
          <div className="data-source"><p>공식 패치노트 누적 변경과 실전 텔레메트리 추천을 구분해 표시합니다.</p></div>
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
