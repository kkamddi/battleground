"use client";

import { useMemo, useState } from "react";
import type { ProgressiveSkin } from "../../../data/progressiveCatalog";

type ImageMap = Record<string, string>;

export default function ProgressiveCatalog({
  skins,
  images,
}: {
  skins: ProgressiveSkin[];
  images: ImageMap;
}) {
  const [query, setQuery] = useState("");
  const [weapon, setWeapon] = useState("전체");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState(skins[0]?.slug ?? "");
  const [selectedLevel, setSelectedLevel] = useState(1);

  const weapons = useMemo(
    () => ["전체", ...Array.from(new Set(skins.map((skin) => skin.weapon))).sort()],
    [skins],
  );
  const filtered = skins.filter((skin) => {
    const keyword = query.trim().toLocaleLowerCase();
    const matchesQuery = !keyword
      || `${skin.name} ${skin.weapon}`.toLocaleLowerCase().includes(keyword);
    return matchesQuery
      && (weapon === "전체" || skin.weapon === weapon)
      && (!verifiedOnly || Boolean(skin.levels));
  });
  const selected = skins.find((skin) => skin.slug === selectedSlug) ?? filtered[0] ?? skins[0];
  const level = selected?.levels?.find((item) => item.level === selectedLevel)
    ?? selected?.levels?.[0];

  const choose = (skin: ProgressiveSkin) => {
    setSelectedSlug(skin.slug);
    setSelectedLevel(1);
    document.getElementById("progressive-detail")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <section className="progressive-summary" aria-label="성장형 스킨 자료 현황">
        <div><strong>{skins.length}</strong><span>역대 성장형 스킨</span></div>
        <div><strong>{skins.filter((skin) => skin.levels).length}</strong><span>공식 레벨 검증 완료</span></div>
        <div><strong>{new Set(skins.map((skin) => skin.weapon)).size}</strong><span>적용 무기</span></div>
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
        <label>
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(event) => setVerifiedOnly(event.target.checked)}
          />
          레벨 정보 확인 완료만
        </label>
      </section>

      <section className="progressive-catalog" aria-label="성장형 스킨 목록">
        {filtered.map((skin) => (
          <button
            type="button"
            key={skin.slug}
            className={selected?.slug === skin.slug ? "active" : ""}
            onClick={() => choose(skin)}
          >
            <span>{skin.released}</span>
            <strong>{skin.name}</strong>
            <small>{skin.weapon}</small>
            <em className={skin.levels ? "verified" : ""}>
              {skin.levels ? `공식 ${skin.maxLevel}단계` : "상세 확인 중"}
            </em>
          </button>
        ))}
        {!filtered.length && <p className="lab-empty">조건에 맞는 성장형 스킨이 없습니다.</p>}
      </section>

      {selected && (
        <section className="progressive-detail" id="progressive-detail">
          <div className={`progressive-detail-visual ${images[selected.slug] ? "" : "placeholder"}`}>
            {images[selected.slug]
              ? <img src={images[selected.slug]} alt={`${selected.name} 공식 대표 이미지`} />
              : <div><span>{selected.weapon}</span><strong>{selected.name}</strong></div>}
            <small>{images[selected.slug] ? "PUBG 공식 대표 이미지" : "공식 대표 이미지 연결 준비 중"}</small>
          </div>
          <div className="progressive-detail-copy">
            <span>{selected.released} · {selected.weapon}</span>
            <h2>{selected.name}</h2>
            {selected.levels ? (
              <>
                <p>공식 공지에서 확인한 최대 {selected.maxLevel}단계 구성입니다. 단계를 선택하면 해금 내용을 바로 확인할 수 있습니다.</p>
                <div className="progressive-level-tabs" aria-label="레벨 선택">
                  {selected.levels.map((item) => (
                    <button
                      type="button"
                      key={item.level}
                      className={level?.level === item.level ? "active" : ""}
                      onClick={() => setSelectedLevel(item.level)}
                    >
                      LV.{item.level}
                    </button>
                  ))}
                </div>
                {level && (
                  <div className="progressive-level-focus">
                    <span>{level.kind}</span>
                    <strong>LV.{level.level}</strong>
                    <p>{level.description}</p>
                  </div>
                )}
                <ol>
                  {selected.levels.map((item) => (
                    <li key={item.level} className={level?.level === item.level ? "active" : ""}>
                      <b>LV.{item.level}</b><span>{item.description}</span><em>{item.kind}</em>
                    </li>
                  ))}
                </ol>
              </>
            ) : (
              <div className="progressive-unverified">
                <strong>역대 출시 목록 확인</strong>
                <p>스킨과 적용 무기는 교차 확인했지만, 레벨별 구성은 공식 원문을 추가 검증 중입니다. 확인되지 않은 단계를 추정해 표시하지 않습니다.</p>
              </div>
            )}
            {selected.officialUrl && (
              <a href={selected.officialUrl} target="_blank" rel="noreferrer">PUBG 공식 공지에서 확인 ↗</a>
            )}
          </div>
        </section>
      )}
    </>
  );
}

