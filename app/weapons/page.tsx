"use client";

import { useState } from "react";
import SiteFooter from "../../components/SiteFooter";
import SiteHeader from "../../components/SiteHeader";

type Weapon = {
  name: string;
  category: string;
  ammo: string;
  damage: string;
  rpm: string;
  velocity: string;
  magazine: string;
  image: string;
  change?: string;
  changeType?: "up" | "down" | "spawn";
};

const imageBase = "https://wstatic-prod.pubg.com/web/live/static/game-info/weapons/images/viewer";

const weaponRows = [
  "M416|AR|5.56mm|40|700|880|30 / 40|m416",
  "AUG|AR|5.56mm|40|750|890|30 / 40|aug_a3",
  "SCAR-L|AR|5.56mm|42|625|870|30 / 40|scar-l",
  "G36C|AR|5.56mm|41|750|870|30 / 40|g36c",
  "QBZ|AR|5.56mm|42|750|870|30 / 40|qbz95",
  "K2|AR|5.56mm|41|750|880|30 / 40|k2",
  "M16A4|AR|5.56mm|43|800|900|30 / 40|m16a4",
  "FAMAS|AR|5.56mm|39|900|930|30|famas_g2",
  "AKM|AR|7.62mm|48|600|715|30 / 40|akm",
  "Beryl M762|AR|7.62mm|44|700|740|30 / 40|beryl_m762",
  "Mk47 Mutant|AR|7.62mm|49|600|780|20 / 30|mk47_mutant",
  "Groza|AR|7.62mm|47|750|715|30 / 40|groza",
  "ACE32|AR|7.62mm|43|680|720|30 / 40|ace32|42.2 태이고 비밀의 방 추가|spawn",
  "Mini14|DMR|5.56mm|42|반자동|990|20 / 30|mini14|37.1 피해량·연사 속도 감소|down",
  "Mk12|DMR|5.56mm|43|반자동|930|20 / 30|mk12|40.1 피해량 44 → 43 · 수평 반동 +8%|down",
  "SKS|DMR|7.62mm|47|반자동|800|10 / 20|sks|37.1 피해량·연사 속도 감소|down",
  "SLR|DMR|7.62mm|49|반자동|870|10 / 20|slr|42.1 탄속 +30m/s · 수평 반동 -10%|up",
  "Mk14|DMR|7.62mm|54|600|853|10 / 20|mk14|37.1 피해량·연사 속도 감소|down",
  "Dragunov|DMR|7.62mm|53|반자동|830|10 / 20|dragunov|41.1 수직 반동 -20% · 수평 반동 -15%|up",
  "VSS|DMR|9mm|43|700|330|10 / 20|vss|42.2 태이고·론도 비밀의 방 제외|spawn",
  "Lynx AMR|SR|.50 Cal|118|단발|1100|10|lynx_amr",
  "AWM|SR|.300|105|볼트액션|945|5 / 7|awm",
  "M24|SR|7.62mm|75|볼트액션|790|5 / 7|m24|42.2 태이고 비밀의 방 추가|spawn",
  "Kar98k|SR|7.62mm|79|볼트액션|760|5|kar98k",
  "Win94|SR|.45 ACP|66|레버액션|760|8|win94",
  "Crossbow|SR|Bolt|105|단발|160|1|crossbow",
  "M249|LMG|5.56mm|41|800|915|75 / 150|m249",
  "MG3|LMG|7.62mm|42|660 / 990|820|75|mg3",
  "P90|SMG|5.7mm|35|1000|715|50|p90",
  "JS9|SMG|9mm|32|900|400|30 / 40|js9|42.2 론도 비밀의 방 추가|spawn",
  "MP9|SMG|9mm|31|1000|400|30 / 40|mp9",
  "MP5K|SMG|9mm|32|800|400|30 / 40|mp5k|38.1 피해량 34 → 32|down",
  "Vector|SMG|9mm|31|1100|350|19 / 33|vector|42.2 태이고 비밀의 방 추가|spawn",
  "Micro UZI|SMG|9mm|26|1250|350|25 / 35|micro_uzi|42.2 태이고 비밀의 방 추가|spawn",
  "UMP45|SMG|.45 ACP|42|670|360|25 / 35|ump45|42.2 태이고·론도 비밀의 방 추가|spawn",
  "Tommy Gun|SMG|.45 ACP|40|750|280|30 / 50|tommy_gun",
  "DBS|SG|12 Gauge|28×9|펌프|420|14|dbs",
  "S12K|SG|12 Gauge|23×9|반자동|420|5 / 10|s12k|42.2 태이고·론도 비밀의 방 추가|spawn",
  "S1897|SG|12 Gauge|26×9|펌프|360|5|s1897",
  "S686|SG|12 Gauge|26×9|2연발|370|2|s686|42.2 태이고 비밀의 방 제외|spawn",
  "Sawed-Off|SG|12 Gauge|22×9|2연발|330|2|sawed_off",
  "O12|SG|12 Gauge|99|반자동|625|30|o12",
  "Deagle|HG|.45 ACP|62|반자동|450|7 / 10|deagle",
  "R1895|HG|7.62mm|64|리볼버|330|7|r1895",
  "P92|HG|9mm|34|반자동|380|15 / 20|p92",
  "P18C|HG|9mm|23|1000|375|17 / 25|p18c",
  "Skorpion|HG|9mm|22|850|350|20 / 40|skorpion",
  "Panzerfaust|ETC|탄두|범위 피해|1회|—|1|panzerfaust",
];

const weapons: Weapon[] = weaponRows.map((row) => {
  const [name, category, ammo, damage, rpm, velocity, magazine, image, change, changeType] = row.split("|");
  return { name, category, ammo, damage, rpm, velocity, magazine, image, change, changeType: changeType as Weapon["changeType"] };
});

const categories = ["전체", "AR", "DMR", "SR", "LMG", "SMG", "SG", "HG", "ETC"];
const featuredNames = ["M416", "AUG", "SLR", "Beryl M762"];

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
          <span>WEAPON INDEX · 42.2</span>
          <h1>총기 도감</h1>
          <p>현재 스펙과 최근 패치 변경을 같은 화면에서 비교합니다. 총 {weapons.length}종.</p>
        </header>

        <section className="weapon-feature-grid">
          {featured.map((weapon) => (
            <article key={weapon.name}>
              <div className="weapon-image">
                <img
                  src={`${imageBase}/img-weapons-${weapon.image}.webp`}
                  alt={`${weapon.name} 총기`}
                  onError={(event) => { event.currentTarget.style.display = "none"; }}
                />
              </div>
              <span>{weapon.category} · {weapon.ammo}</span>
              <h2>{weapon.name}</h2>
              <dl><div><dt>피해량</dt><dd>{weapon.damage}</dd></div><div><dt>RPM</dt><dd>{weapon.rpm}</dd></div><div><dt>탄속</dt><dd>{weapon.velocity}</dd></div></dl>
            </article>
          ))}
        </section>

        <section className="weapon-catalog">
          <div className="weapon-toolbar">
            <div className="category-tabs">
              {categories.map((category) => (
                <button className={category === activeCategory ? "active" : ""} onClick={() => setActiveCategory(category)} type="button" key={category}>
                  {category}
                </button>
              ))}
            </div>
            <label className="weapon-search" htmlFor="weapon-search">
              <span>검색</span>
              <input id="weapon-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="총기명" />
            </label>
          </div>
          <div className="weapon-table-wrap">
            <table className="weapon-table">
              <thead><tr><th>총기</th><th>분류</th><th>탄약</th><th>피해량</th><th>RPM</th><th>탄속 m/s</th><th>탄창</th><th>최근 변경</th></tr></thead>
              <tbody>
                {filtered.map((weapon) => (
                  <tr key={`${weapon.category}-${weapon.name}`}>
                    <td>
                      <div className="weapon-name-cell">
                        <span className="weapon-thumb">
                          <img
                            src={`${imageBase}/img-weapons-${weapon.image}.webp`}
                            alt=""
                            onError={(event) => { event.currentTarget.style.display = "none"; }}
                          />
                        </span>
                        <strong>{weapon.name}</strong>
                      </div>
                    </td>
                    <td><span className="category-code">{weapon.category}</span></td>
                    <td>{weapon.ammo}</td><td>{weapon.damage}</td><td>{weapon.rpm}</td><td>{weapon.velocity}</td><td>{weapon.magazine}</td>
                    <td>{weapon.change ? <span className={`change ${weapon.changeType}`}>{weapon.change}</span> : <span className="no-change">변경 없음</span>}</td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td className="empty-result" colSpan={8}>조건에 맞는 총기가 없습니다.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="data-source">
            <p><strong>이미지·분류</strong> PUBG 공식 PC·콘솔 게임 정보 페이지</p>
            <p><strong>수치 스펙</strong> <a href="https://pubgstatistics.com/weapons" target="_blank" rel="noreferrer">최신 매치 기반 외부 자료</a>를 공식 패치 이력과 교차 검증했습니다. 공식 제공 수치가 아니며 게임 빌드와 차이가 있을 수 있습니다.</p>
          </div>
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
