"use client";

import { useMemo, useState } from "react";
import type { ProgressiveSkin } from "../../../data/progressiveCatalog";

export default function ProgressiveCatalog({ skins }: { skins: ProgressiveSkin[] }) {
  const [query, setQuery] = useState("");
  const [weapon, setWeapon] = useState("전체");
  const [year, setYear] = useState("전체");

  const weapons = useMemo(
    () => ["전체", ...Array.from(new Set(skins.map((skin) => skin.weapon))).sort()],
    [skins],
  );
  const years = useMemo(
    () => ["전체", ...Array.from(new Set(skins.map((skin) => skin.released.slice(0, 4)))).sort().reverse()],
    [skins],
  );
  const filtered = skins.filter((skin) => {
    const keyword = query.trim().toLocaleLowerCase();
    return (!keyword || `${skin.name} ${skin.weapon}`.toLocaleLowerCase().includes(keyword))
      && (weapon === "전체" || skin.weapon === weapon)
      && (year === "전체" || skin.released.startsWith(year));
  });

  return (
    <>
      <section className="progressive-summary" aria-label="성장형 스킨 자료 현황">
        <div><strong>{skins.length}</strong><span>역대 성장형 스킨</span></div>
        <div><strong>{new Set(skins.map((skin) => skin.weapon)).size}</strong><span>적용 무기</span></div>
        <div><strong>2021—2026</strong><span>정리된 출시 기간</span></div>
      </section>

      <section className="progressive-tools" aria-label="성장형 스킨 필터">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="스킨 또는 무기 검색"
          aria-label="스킨 또는 무기 검색"
        />
        <select value={weapon} onChange={(event) => setWeapon(event.target.value)} aria-label="무기 선택">
          {weapons.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={year} onChange={(event) => setYear(event.target.value)} aria-label="출시 연도 선택">
          {years.map((item) => <option key={item}>{item === "전체" ? "전체 연도" : `${item}년`}</option>)}
        </select>
      </section>

      <section className="progressive-catalog" aria-label="성장형 스킨 목록">
        {filtered.map((skin) => (
          <article key={skin.slug}>
            <span>{skin.released}</span>
            <h2>{skin.name}</h2>
            <p>{skin.weapon}</p>
            {skin.officialUrl
              ? <a href={skin.officialUrl} target="_blank" rel="noreferrer">공식 공지 ↗</a>
              : <small>출시 목록 확인</small>}
          </article>
        ))}
        {!filtered.length && <p className="lab-empty">조건에 맞는 성장형 스킨이 없습니다.</p>}
      </section>
    </>
  );
}

