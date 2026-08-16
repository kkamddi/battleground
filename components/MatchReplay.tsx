"use client";

import { useEffect, useMemo, useState } from "react";
import { mapCatalog } from "../lib/mapData";
import type { MatchReplay as MatchReplayData } from "../lib/pubgReplay";
import type { PubgPlatform } from "../lib/pubg";

const colors = ["#14783f", "#2456a6", "#a4512c", "#6750a4"];

function clock(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

export default function MatchReplay({ accountId, matchId, platform }: { accountId: string; matchId: string; platform: PubgPlatform }) {
  const [data, setData] = useState<MatchReplayData | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing || !data) return;
    const timer = window.setInterval(() => {
      setCursor((current) => {
        if (current >= data.durationSeconds) {
          setPlaying(false);
          return data.durationSeconds;
        }
        return Math.min(data.durationSeconds, current + 5);
      });
    }, 250);
    return () => window.clearInterval(timer);
  }, [data, playing]);

  async function load() {
    if (data) return;
    setStatus("loading");
    try {
      const response = await fetch(`/api/replay/${platform}/${encodeURIComponent(matchId)}?accountId=${encodeURIComponent(accountId)}`);
      if (!response.ok) throw new Error(`REPLAY_${response.status}`);
      const replay = await response.json() as MatchReplayData;
      setData(replay);
      setCursor(replay.durationSeconds);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  const latestZone = useMemo(() => data?.zones.filter((zone) => zone.elapsedSeconds <= cursor).at(-1), [cursor, data]);

  if (!data) {
    return (
      <div className="match-replay-launcher">
        <button disabled={status === "loading"} onClick={load} type="button">
          {status === "loading" ? "리플레이 분석 중…" : "2D 리플레이 보기"}
        </button>
        {status === "error" ? <span>이 매치의 텔레메트리를 불러올 수 없습니다.</span> : <small>본인과 팀원의 이동·교전·자기장을 표시합니다.</small>}
      </div>
    );
  }

  const definition = mapCatalog[data.mapSlug];
  const scale = 1000 / data.worldSize;
  return (
    <section className="match-replay-viewer">
      <div className="match-replay-head">
        <div><span>2D REPLAY LITE</span><strong>{data.mapName} · 팀 이동 경로</strong></div>
        <button onClick={() => setPlaying((current) => !current)} type="button">{playing ? "일시정지" : cursor >= data.durationSeconds ? "처음부터 재생" : "재생"}</button>
      </div>
      <div className="match-replay-map">
        <img alt={`${data.mapName} 2D 리플레이 지도`} src={definition.image} />
        <svg aria-label="선수 이동 경로" viewBox="0 0 1000 1000">
          {latestZone ? <circle className="replay-zone" cx={latestZone.x * scale} cy={latestZone.y * scale} r={latestZone.radius * scale} /> : null}
          {data.players.map((player, index) => {
            const visible = player.points.filter((point) => point.elapsedSeconds <= cursor);
            const last = visible.at(-1);
            const color = player.subject ? colors[0] : colors[(index % (colors.length - 1)) + 1];
            return (
              <g key={player.accountId}>
                <polyline fill="none" points={visible.map((point) => `${point.x * scale},${point.y * scale}`).join(" ")} stroke={color} strokeWidth={player.subject ? 6 : 4} />
                {last ? <circle cx={last.x * scale} cy={last.y * scale} fill={color} r={player.subject ? 10 : 8} stroke="white" strokeWidth="3" /> : null}
              </g>
            );
          })}
          {data.events.filter((event) => event.elapsedSeconds <= cursor).map((event, index) => (
            <circle className={`replay-event ${event.type}`} cx={event.x * scale} cy={event.y * scale} key={`${event.type}-${event.elapsedSeconds}-${index}`} r="7">
              <title>{clock(event.elapsedSeconds)} · {event.label}</title>
            </circle>
          ))}
        </svg>
      </div>
      <div className="match-replay-controls">
        <input aria-label="리플레이 시간" max={data.durationSeconds} min="0" onChange={(event) => { setPlaying(false); setCursor(Number(event.target.value)); }} step="5" type="range" value={cursor} />
        <strong>{clock(cursor)} / {clock(data.durationSeconds)}</strong>
      </div>
      <div className="match-replay-legend">
        {data.players.map((player, index) => <span key={player.accountId}><i style={{ background: player.subject ? colors[0] : colors[(index % (colors.length - 1)) + 1] }} />{player.name}{player.subject ? " · 나" : ""}</span>)}
        <span><i className="kill" />킬</span><span><i className="death" />사망</span><span><i className="revive" />부활</span>
      </div>
    </section>
  );
}
