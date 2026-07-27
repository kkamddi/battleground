"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { PubgPlatform } from "../lib/pubg";

export default function PlayerSearchForm({
  compact = false,
  platform: initialPlatform = "steam",
}: {
  compact?: boolean;
  platform?: PubgPlatform;
}) {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [platform, setPlatform] = useState<PubgPlatform>(initialPlatform);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = nickname.trim();
    if (!value) return;
    router.push(`/player/${platform}/${encodeURIComponent(value)}`);
  }

  return (
    <form className={compact ? "player-search compact" : "player-search"} onSubmit={submit}>
      <label htmlFor={compact ? "header-player-name" : "player-name"}>
        {compact ? "닉네임" : "PUBG 게임 닉네임"}
      </label>
      <div>
        <select
          aria-label="PUBG 플랫폼"
          onChange={(event) => setPlatform(event.target.value as PubgPlatform)}
          value={platform}
        >
          <option value="steam">Steam</option>
          <option value="kakao">Kakao</option>
        </select>
        <input
          id={compact ? "header-player-name" : "player-name"}
          maxLength={32}
          onChange={(event) => setNickname(event.target.value)}
          placeholder="게임 내 닉네임 입력"
          spellCheck={false}
          value={nickname}
        />
        <button type="submit">전적 검색</button>
      </div>
    </form>
  );
}
