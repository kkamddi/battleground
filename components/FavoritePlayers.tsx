"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PubgPlatform } from "../lib/pubg";

const storageKey = "bgi-favorite-players";

type FavoritePlayer = { key: string; platform: PubgPlatform; nickname: string };

function readFavorites(): FavoritePlayer[] {
  try {
    const stored = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]");
    if (!Array.isArray(stored)) return [];
    return stored.flatMap((value): FavoritePlayer[] => {
      if (typeof value !== "string") return [];
      const separator = value.indexOf(":");
      const platform = value.slice(0, separator);
      const nickname = value.slice(separator + 1).trim();
      if ((platform !== "steam" && platform !== "kakao") || !nickname) return [];
      return [{ key: value, platform, nickname }];
    }).slice(0, 10);
  } catch {
    return [];
  }
}

export default function FavoritePlayers() {
  const [favorites, setFavorites] = useState<FavoritePlayer[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      setFavorites(readFavorites());
      setReady(true);
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("bgi-favorites-change", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("bgi-favorites-change", sync);
    };
  }, []);

  function remove(playerKey: string) {
    const next = readFavorites().filter((player) => player.key !== playerKey).map((player) => player.key);
    window.localStorage.setItem(storageKey, JSON.stringify(next));
    window.dispatchEvent(new Event("bgi-favorites-change"));
  }

  if (!ready || !favorites.length) return null;

  return (
    <section className="favorite-players" aria-label="즐겨찾는 플레이어">
      <div className="favorite-players-head">
        <div><span>MY PLAYERS</span><h2>즐겨찾기</h2></div>
        <p>이 브라우저에 저장된 플레이어</p>
      </div>
      <div className="favorite-player-list">
        {favorites.map((player) => (
          <article key={player.key}>
            <Link href={`/player/${player.platform}/${encodeURIComponent(player.nickname)}`}>
              <span className={`platform-mark ${player.platform}`}>{player.platform === "kakao" ? "K" : "S"}</span>
              <strong>{player.nickname}</strong>
              <small>{player.platform === "kakao" ? "Kakao" : "Steam"}</small>
            </Link>
            <button aria-label={`${player.nickname} 즐겨찾기 삭제`} onClick={() => remove(player.key)} type="button">삭제</button>
          </article>
        ))}
      </div>
    </section>
  );
}
