"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PlayerTools({ nickname }: { nickname: string }) {
  const router = useRouter();
  const [compareName, setCompareName] = useState("");
  const [favorite, setFavorite] = useState(false);
  const storageKey = "bgi-favorite-players";

  useEffect(() => {
    const players = JSON.parse(localStorage.getItem(storageKey) ?? "[]") as string[];
    setFavorite(players.includes(nickname));
  }, [nickname]);

  function compare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = compareName.trim();
    if (!value || value.toLowerCase() === nickname.toLowerCase()) return;
    router.push(`/player/steam/${encodeURIComponent(nickname)}?compare=${encodeURIComponent(value)}`);
  }

  function toggleFavorite() {
    const players = JSON.parse(localStorage.getItem(storageKey) ?? "[]") as string[];
    const next = players.includes(nickname)
      ? players.filter((player) => player !== nickname)
      : [nickname, ...players].slice(0, 10);
    localStorage.setItem(storageKey, JSON.stringify(next));
    setFavorite(next.includes(nickname));
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
        <label htmlFor="compare-player">플레이어 비교</label>
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
        <button type="button" onClick={toggleFavorite}>
          {favorite ? "★ 즐겨찾기 저장됨" : "☆ 즐겨찾기"}
        </button>
        <button type="button" onClick={share}>전적 공유</button>
      </div>
    </section>
  );
}
