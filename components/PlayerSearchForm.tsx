"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function PlayerSearchForm({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [nickname, setNickname] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = nickname.trim();
    if (!value) return;
    router.push(`/player/steam/${encodeURIComponent(value)}`);
  }

  return (
    <form className={compact ? "player-search compact" : "player-search"} onSubmit={submit}>
      <label htmlFor={compact ? "header-player-name" : "player-name"}>
        {compact ? "닉네임" : "PUBG 게임 닉네임"}
      </label>
      <div>
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
