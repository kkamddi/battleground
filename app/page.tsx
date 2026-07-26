"use client";

import { useState } from "react";

type Weapon = {
  name: string;
  category: string;
  ammo: string;
  damage: string;
  rpm: string;
  velocity: string;
  magazine: string;
  change?: string;
  changeType?: "up" | "down" | "spawn";
};

const weapons: Weapon[] = [
  { name: "M416", category: "AR", ammo: "5.56mm", damage: "40", rpm: "700", velocity: "880", magazine: "30 / 40" },
  { name: "AUG", category: "AR", ammo: "5.56mm", damage: "41", rpm: "750", velocity: "890", magazine: "30 / 40" },
  { name: "SCAR-L", category: "AR", ammo: "5.56mm", damage: "42", rpm: "625", velocity: "870", magazine: "30 / 40" },
  { name: "G36C", category: "AR", ammo: "5.56mm", damage: "41", rpm: "750", velocity: "870", magazine: "30 / 40" },
  { name: "QBZ", category: "AR", ammo: "5.56mm", damage: "42", rpm: "750", velocity: "870", magazine: "30 / 40" },
  { name: "K2", category: "AR", ammo: "5.56mm", damage: "41", rpm: "750", velocity: "880", magazine: "30 / 40" },
  { name: "M16A4", category: "AR", ammo: "5.56mm", damage: "43", rpm: "800", velocity: "900", magazine: "30 / 40" },
  { name: "FAMAS", category: "AR", ammo: "5.56mm", damage: "39", rpm: "900", velocity: "930", magazine: "30" },
  { name: "AKM", category: "AR", ammo: "7.62mm", damage: "47", rpm: "600", velocity: "715", magazine: "30 / 40" },
  { name: "Beryl M762", category: "AR", ammo: "7.62mm", damage: "44", rpm: "700", velocity: "740", magazine: "30 / 40" },
  { name: "Mk47 Mutant", category: "AR", ammo: "7.62mm", damage: "49", rpm: "600", velocity: "780", magazine: "20 / 30" },
  { name: "Groza", category: "AR", ammo: "7.62mm", damage: "47", rpm: "750", velocity: "715", magazine: "30 / 40" },
  { name: "ACE32", category: "AR", ammo: "7.62mm", damage: "43", rpm: "680", velocity: "720", magazine: "30 / 40", change: "42.2 태이고 비밀의 방 추가", changeType: "spawn" },

  { name: "Mini14", category: "DMR", ammo: "5.56mm", damage: "48", rpm: "반자동", velocity: "990", magazine: "20 / 30" },
  { name: "Mk12", category: "DMR", ammo: "5.56mm", damage: "50", rpm: "반자동", velocity: "930", magazine: "20 / 30" },
  { name: "QBU", category: "DMR", ammo: "5.56mm", damage: "48", rpm: "반자동", velocity: "945", magazine: "10 / 20", change: "42.1 월드 스폰 제외", changeType: "spawn" },
  { name: "SKS", category: "DMR", ammo: "7.62mm", damage: "53", rpm: "반자동", velocity: "800", magazine: "10 / 20" },
  { name: "SLR", category: "DMR", ammo: "7.62mm", damage: "56", rpm: "반자동", velocity: "870", magazine: "10 / 20", change: "42.1 탄속 +30m/s · 수평 반동 -10%", changeType: "up" },
  { name: "Mk14", category: "DMR", ammo: "7.62mm", damage: "61", rpm: "600", velocity: "853", magazine: "10 / 20" },
  { name: "Dragunov", category: "DMR", ammo: "7.62mm", damage: "60", rpm: "반자동", velocity: "830", magazine: "10 / 20" },
  { name: "VSS", category: "DMR", ammo: "9mm", damage: "43", rpm: "700", velocity: "330", magazine: "10 / 20", change: "42.2 태이고·론도 비밀의 방 제외", changeType: "spawn" },

  { name: "Lynx AMR", category: "SR", ammo: ".50 Cal", damage: "118", rpm: "단발", velocity: "1100", magazine: "10" },
  { name: "AWM", category: "SR", ammo: ".300", damage: "105", rpm: "볼트액션", velocity: "945", magazine: "5 / 7" },
  { name: "M24", category: "SR", ammo: "7.62mm", damage: "75", rpm: "볼트액션", velocity: "790", magazine: "5 / 7", change: "42.2 태이고 비밀의 방 추가", changeType: "spawn" },
  { name: "Kar98k", category: "SR", ammo: "7.62mm", damage: "79", rpm: "볼트액션", velocity: "760", magazine: "5" },
  { name: "Mosin Nagant", category: "SR", ammo: "7.62mm", damage: "79", rpm: "볼트액션", velocity: "760", magazine: "5", change: "42.1 월드 스폰 제외", changeType: "spawn" },
  { name: "Win94", category: "SR", ammo: ".45 ACP", damage: "66", rpm: "레버액션", velocity: "760", magazine: "8" },
  { name: "Crossbow", category: "SR", ammo: "Bolt", damage: "105", rpm: "단발", velocity: "160", magazine: "1" },

  { name: "M249", category: "LMG", ammo: "5.56mm", damage: "41", rpm: "800", velocity: "915", magazine: "75 / 150" },
  { name: "MG3", category: "LMG", ammo: "7.62mm", damage: "42", rpm: "660 / 990", velocity: "820", magazine: "75" },
  { name: "DP-28", category: "LMG", ammo: "7.62mm", damage: "52", rpm: "550", velocity: "840", magazine: "47", change: "42.1 월드 스폰 제외", changeType: "spawn" },

  { name: "P90", category: "SMG", ammo: "5.7mm", damage: "35", rpm: "1000", velocity: "715", magazine: "50" },
  { name: "JS9", category: "SMG", ammo: "9mm", damage: "34", rpm: "900", velocity: "400", magazine: "30 / 40", change: "42.2 론도 비밀의 방 추가", changeType: "spawn" },
  { name: "MP9", category: "SMG", ammo: "9mm", damage: "31", rpm: "1000", velocity: "400", magazine: "30 / 40" },
  { name: "MP5K", category: "SMG", ammo: "9mm", damage: "33", rpm: "800", velocity: "400", magazine: "30 / 40", change: "42.2 론도 비밀의 방 추가", changeType: "spawn" },
  { name: "Vector", category: "SMG", ammo: "9mm", damage: "31", rpm: "1100", velocity: "350", magazine: "19 / 33", change: "42.2 태이고 비밀의 방 추가", changeType: "spawn" },
  { name: "Micro UZI", category: "SMG", ammo: "9mm", damage: "26", rpm: "1250", velocity: "350", magazine: "25 / 35", change: "42.2 태이고 비밀의 방 추가", changeType: "spawn" },
  { name: "PP-19 Bizon", category: "SMG", ammo: "9mm", damage: "36", rpm: "660", velocity: "408", magazine: "53", change: "42.1 월드 스폰 제외", changeType: "spawn" },
  { name: "UMP45", category: "SMG", ammo: ".45 ACP", damage: "41", rpm: "670", velocity: "360", magazine: "25 / 35", change: "42.2 태이고·론도 비밀의 방 추가", changeType: "spawn" },
  { name: "Tommy Gun", category: "SMG", ammo: ".45 ACP", damage: "40", rpm: "750", velocity: "280", magazine: "30 / 50" },

  { name: "DBS", category: "SG", ammo: "12 Gauge", damage: "26×9", rpm: "펌프", velocity: "420", magazine: "14" },
  { name: "S12K", category: "SG", ammo: "12 Gauge", damage: "24×9", rpm: "반자동", velocity: "420", magazine: "5 / 10", change: "42.2 태이고·론도 비밀의 방 추가", changeType: "spawn" },
  { name: "S1897", category: "SG", ammo: "12 Gauge", damage: "26×9", rpm: "펌프", velocity: "360", magazine: "5" },
  { name: "S686", category: "SG", ammo: "12 Gauge", damage: "26×9", rpm: "2연발", velocity: "370", magazine: "2", change: "42.2 태이고 비밀의 방 제외", changeType: "spawn" },
  { name: "Sawed-Off", category: "SG", ammo: "12 Gauge", damage: "22×9", rpm: "2연발", velocity: "330", magazine: "2" },
  { name: "O12", category: "SG", ammo: "12 Gauge", damage: "100", rpm: "반자동", velocity: "625", magazine: "30" },

  { name: "Deagle", category: "HG", ammo: ".45 ACP", damage: "62", rpm: "반자동", velocity: "450", magazine: "7 / 10" },
  { name: "R1895", category: "HG", ammo: "7.62mm", damage: "64", rpm: "리볼버", velocity: "330", magazine: "7" },
  { name: "R45", category: "HG", ammo: ".45 ACP", damage: "65", rpm: "리볼버", velocity: "330", magazine: "6", change: "42.1 월드 스폰 제외", changeType: "spawn" },
  { name: "P1911", category: "HG", ammo: ".45 ACP", damage: "42", rpm: "반자동", velocity: "250", magazine: "7 / 12", change: "42.1 월드 스폰 제외", changeType: "spawn" },
  { name: "P92", category: "HG", ammo: "9mm", damage: "35", rpm: "반자동", velocity: "380", magazine: "15 / 20" },
  { name: "P18C", category: "HG", ammo: "9mm", damage: "23", rpm: "1000", velocity: "375", magazine: "17 / 25" },
  { name: "Skorpion", category: "HG", ammo: "9mm", damage: "22", rpm: "850", velocity: "350", magazine: "20 / 40" },

  { name: "Panzerfaust", category: "ETC", ammo: "탄두", damage: "범위 피해", rpm: "1회", velocity: "—", magazine: "1" },
];

const categories = ["전체", "AR", "DMR", "SR", "LMG", "SMG", "SG", "HG", "ETC"];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("전체");
  const [query, setQuery] = useState("");
  const changedWeapons = weapons.filter((weapon) => weapon.change);
  const filteredWeapons = weapons.filter((weapon) => {
    const matchesCategory = activeCategory === "전체" || weapon.category === activeCategory;
    const matchesQuery = weapon.name.toLowerCase().includes(query.trim().toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="BGN 홈">
          <strong>BGN</strong>
          <span>BATTLEGROUND<br />NEWS</span>
        </a>
        <nav aria-label="주요 메뉴">
          <a href="#patch">패치노트</a>
          <a href="#weapons">총기 도감</a>
          <a href="#meta">메타</a>
          <a href="#guide">가이드</a>
        </nav>
        <a className="search-button" href="#weapon-search">총기 검색 <kbd>/</kbd></a>
      </header>

      <div className="page-shell" id="top">
        <section className="briefing">
          <div className="briefing-main">
            <div className="eyebrow-row">
              <span className="live-badge">LIVE</span>
              <span>UPDATE 42.2</span>
              <span>2026.07.14</span>
            </div>
            <h1>42.2 업데이트,<br />바뀐 내용만 빠르게.</h1>
            <p>
              기본 훈련 개편과 태이고·론도 비밀의 방 변경이 핵심입니다.
              이번 버전에는 총기 기본 성능 조정이 없습니다.
            </p>
            <a className="plain-link" href="https://www.pubg.com/ko/news/10459" target="_blank" rel="noreferrer">
              공식 패치노트 원문 보기 ↗
            </a>
          </div>

          <aside className="release-info">
            <div><span>PC 적용</span><strong>07.15</strong></div>
            <div><span>CONSOLE 적용</span><strong>07.23</strong></div>
            <p>현재 라이브 버전 기준</p>
          </aside>
        </section>

        <section className="patch-summary" id="patch">
          <div className="section-title">
            <div>
              <span>PATCH 42.2</span>
              <h2>이번 패치 요약</h2>
            </div>
            <p>긴 원문에서 플레이에 영향을 주는 내용만 정리했습니다.</p>
          </div>

          <div className="summary-list">
            <article>
              <span className="summary-number">01</span>
              <div><b>훈련</b><h3>기본 훈련 전면 개편</h3><p>17개 챕터와 초심자 훈련소가 추가되었습니다.</p></div>
              <span className="summary-tag">신규</span>
            </article>
            <article>
              <span className="summary-number">02</span>
              <div><b>맵</b><h3>태이고·론도 비밀의 방</h3><p>스폰 총기 목록과 보급 총기 슬롯이 변경되었습니다.</p></div>
              <span className="summary-tag neutral">변경</span>
            </article>
            <article>
              <span className="summary-number">03</span>
              <div><b>총기</b><h3>기본 성능 변경 없음</h3><p>피해량, RPM, 반동 등 직접적인 밸런스 조정은 없습니다.</p></div>
              <span className="summary-tag quiet">유지</span>
            </article>
            <article>
              <span className="summary-number">04</span>
              <div><b>콘솔</b><h3>그래픽 모드 개선</h3><p>지원 기기에서 해상도 또는 최대 120fps 우선 모드를 선택할 수 있습니다.</p></div>
              <span className="summary-tag neutral">개선</span>
            </article>
          </div>
        </section>

        <section className="change-strip">
          <div>
            <span>직전 총기 밸런스</span>
            <strong>42.1 · SLR</strong>
          </div>
          <p>탄속 840 → 870m/s</p>
          <p>수평 반동 약 10% 감소</p>
          <p>초·중반 수직 반동 누적 감소</p>
        </section>

        <section className="weapon-section" id="weapons">
          <div className="section-title weapon-heading">
            <div>
              <span>WEAPON INDEX · 42.2</span>
              <h2>총기 도감</h2>
            </div>
            <p>전체 {weapons.length}종 · 최근 변경 {changedWeapons.length}종</p>
          </div>

          <div className="toolbar">
            <div className="category-tabs" aria-label="총기 카테고리">
              {categories.map((category) => (
                <button
                  className={activeCategory === category ? "active" : ""}
                  type="button"
                  key={category}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
            <label className="weapon-search" htmlFor="weapon-search">
              <span>검색</span>
              <input
                id="weapon-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="총기명"
              />
            </label>
          </div>

          <div className="weapon-table-wrap">
            <table className="weapon-table">
              <thead>
                <tr>
                  <th>총기</th>
                  <th>분류</th>
                  <th>탄약</th>
                  <th>피해량</th>
                  <th>RPM</th>
                  <th>탄속 m/s</th>
                  <th>탄창</th>
                  <th>이전 패치 대비 변경</th>
                </tr>
              </thead>
              <tbody>
                {filteredWeapons.map((weapon) => (
                  <tr key={`${weapon.category}-${weapon.name}`}>
                    <td><strong>{weapon.name}</strong></td>
                    <td><span className="category-code">{weapon.category}</span></td>
                    <td>{weapon.ammo}</td>
                    <td className="numeric">{weapon.damage}</td>
                    <td className="numeric">{weapon.rpm}</td>
                    <td className="numeric">{weapon.velocity}</td>
                    <td>{weapon.magazine}</td>
                    <td>
                      {weapon.change ? (
                        <span className={`change ${weapon.changeType}`}>{weapon.change}</span>
                      ) : (
                        <span className="no-change">변경 없음</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredWeapons.length === 0 && (
                  <tr>
                    <td className="empty-result" colSpan={8}>조건에 맞는 총기가 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="data-source">
            <p><strong>데이터 기준</strong> PUBG 공식 무기 분류와 공개된 42.1·42.2 패치노트를 기준으로 구성했습니다.</p>
            <p>세부 스펙은 공개 데이터 교차 검증 단계이며 게임 빌드와 차이가 있을 수 있습니다. 샷건 피해량은 펠릿 수를 함께 표시합니다.</p>
          </div>
        </section>

        <section className="compact-meta" id="meta">
          <div className="section-title">
            <div><span>NEXT</span><h2>메타 통계 준비 중</h2></div>
            <p>공식 API 표본 수집 후 사용률·킬 점유율·파츠 장착률을 공개합니다.</p>
          </div>
          <div className="metric-placeholder">
            <span>수집 기간</span><strong>—</strong>
            <span>표본 매치</span><strong>—</strong>
            <span>마지막 갱신</span><strong>—</strong>
          </div>
        </section>
      </div>

      <footer id="guide">
        <a className="brand footer-brand" href="#top"><strong>BGN</strong><span>BATTLEGROUND<br />NEWS</span></a>
        <p>비공식 PUBG 정보 서비스입니다. KRAFTON 또는 PUBG의 공식 서비스가 아닙니다.</p>
        <div><a href="#weapons">데이터 기준</a><a href="#patch">패치노트</a></div>
      </footer>
    </main>
  );
}
