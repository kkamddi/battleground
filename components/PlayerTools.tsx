"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { PubgPlatform } from "../lib/pubg";

export default function PlayerTools({
  nickname,
  platform,
}: {
  nickname: string;
  platform: PubgPlatform;
}) {
  const router = useRouter();
  const [compareName, setCompareName] = useState("");
  const [favorite, setFavorite] = useState(false);
  const storageKey = "bgi-favorite-players";
  const playerKey = `${platform}:${nickname}`;

  function readFavoriteKeys() {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
      return Array.isArray(stored) ? stored.filter((value): value is string => typeof value === "string") : [];
    } catch {
      localStorage.removeItem(storageKey);
      return [];
    }
  }

  useEffect(() => {
    const players = readFavoriteKeys();
    setFavorite(players.includes(playerKey));
  }, [playerKey]);

  function compare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = compareName.trim();
    if (!value || value.toLowerCase() === nickname.toLowerCase()) return;
    router.push(`/player/${platform}/${encodeURIComponent(nickname)}?compare=${encodeURIComponent(value)}`);
  }

  function toggleFavorite() {
    const players = readFavoriteKeys();
    const next = players.includes(playerKey)
      ? players.filter((player) => player !== playerKey)
      : [playerKey, ...players].slice(0, 10);
    localStorage.setItem(storageKey, JSON.stringify(next));
    setFavorite(next.includes(playerKey));
    window.dispatchEvent(new Event("bgi-favorites-change"));
  }

  async function share() {
    const data = {
      title: `${nickname} PUBG 전적`,
      text: `BGI에서 ${nickname}의 PUBG 전적을 확인해 보세요.`,
      url: window.location.href,
    };
    if (navigator.share) {
      await navigator.share(data).catch(() => undefined);
    } else {
      await navigator.clipboard.writeText(data.url);
      window.alert("전적 링크를 복사했습니다.");
    }
  }

  return (
    <section className="player-tools">
      <form onSubmit={compare}>
        <label className="sr-only" htmlFor="compare-player">플레이어 비교</label>
        <div>
          <input
            id="compare-player"
            maxLength={32}
            onChange={(event) => setCompareName(event.target.value)}
            placeholder="비교할 닉네임"
            spellCheck={false}
            value={compareName}
          />
          <button type="submit">비교</button>
        </div>
      </form>
      <div>
        <button
          aria-pressed={favorite}
          className={favorite ? "favorite-active" : ""}
          key={favorite ? "favorite-saved" : "favorite-empty"}
          type="button"
          onClick={toggleFavorite}
        >
          {favorite ? "★ 저장됨" : "☆ 즐겨찾기"}
        </button>
        <button type="button" onClick={share}>공유</button>
      </div>
    </section>
  );
}
