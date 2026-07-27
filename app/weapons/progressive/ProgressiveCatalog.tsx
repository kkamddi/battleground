"use client";

import { useMemo, useState } from "react";
import type { ProgressiveSkin } from "../../../data/progressiveCatalog";

export default function ProgressiveCatalog({ skins }: { skins: ProgressiveSkin[] }) {
  const [query, setQuery] = useState("");
  const [weapon, setWeapon] = useState("전체");
  const [year, setYear] = useState("전체");
  const [selectedSlug, setSelectedSlug] = useState(skins[0]?.slug ?? "");

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
  const selected = skins.find((skin) => skin.slug === selectedSlug) ?? filtered[0] ?? skins[0];
  const selectedImage = selected?.officialImageUrl ?? selected?.baseImageUrl;

  const choose = (slug: string) => {
    setSelectedSlug(slug);
    document.getElementById("progressive-skin-detail")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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
          <button
            type="button"
            key={skin.slug}
            className={selected?.slug === skin.slug ? "active" : ""}
            onClick={() => choose(skin.slug)}
          >
            <span>{skin.released}</span>
            <h2>{skin.name}</h2>
            <p>{skin.weapon}</p>
            <small>{skin.levels ? `공식 ${skin.maxLevel}단계 정보` : "상세 보기"}</small>
          </button>
        ))}
        {!filtered.length && <p className="lab-empty">조건에 맞는 성장형 스킨이 없습니다.</p>}
      </section>

      {selected && (
        <section className="progressive-skin-detail" id="progressive-skin-detail">
          <div className={`progressive-skin-image ${selectedImage ? "" : "placeholder"}`}>
            {selectedImage
              ? <img src={selectedImage} alt={`${selected.name} 대표 이미지`} />
              : <div><span>{selected.weapon}</span><strong>{selected.name}</strong></div>}
            <small>{selectedImage ? "대표 이미지 · 레벨별 외형 이미지 아님" : "대표 이미지 확인 중"}</small>
          </div>
          <div className="progressive-skin-copy">
            <span>{selected.released} · {selected.weapon}</span>
            <h2>{selected.name}</h2>
            <dl>
              <div><dt>적용 무기</dt><dd>{selected.weapon}</dd></div>
              <div><dt>출시 시기</dt><dd>{selected.released}</dd></div>
              <div><dt>최대 레벨</dt><dd>{selected.maxLevel ? `LV.${selected.maxLevel}` : "공식 확인 중"}</dd></div>
              <div><dt>자료 상태</dt><dd>{selected.levels ? "공식 레벨 정보 확인" : "출시 목록 확인"}</dd></div>
            </dl>

            {selected.levels ? (
              <>
                <h3>레벨별 해금 구성</h3>
                <ol>
                  {selected.levels.map((item) => (
                    <li key={item.level}>
                      <b>LV.{item.level}</b>
                      <span>{item.description}</span>
                      <em>{item.kind}</em>
                    </li>
                  ))}
                </ol>
              </>
            ) : (
              <div className="progressive-detail-note">
                <strong>공식 세부 정보 확인 중</strong>
                <p>성장형 스킨의 명칭과 적용 무기는 확인됐습니다. 최대 레벨과 해금 구성은 공식 원문을 검증한 뒤 추가합니다.</p>
              </div>
            )}

            <div className="progressive-detail-links">
              {selected.officialUrl && <a href={selected.officialUrl} target="_blank" rel="noreferrer">PUBG 공식 공지 ↗</a>}
              {!selected.officialUrl && selected.baseImageSourceUrl && (
                <a href={selected.baseImageSourceUrl} target="_blank" rel="noreferrer">아이템 출처 ↗</a>
              )}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
