"use client";

import { useState } from "react";

type PlayerShareCardProps = {
  nickname: string;
  platform: string;
  styleName: string;
  kd: number;
  adr: number;
  winRate: string;
  topWeapon?: string;
  recentKills: number;
  recentDamage: number;
};

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fill();
}

export default function PlayerShareCard(props: PlayerShareCardProps) {
  const [message, setMessage] = useState("");

  async function shareCard() {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 630;
    const context = canvas.getContext("2d");
    if (!context) return;

    const english = document.documentElement.lang === "en";
    const labels = english
      ? { report: "PLAYER REPORT", style: "PLAY STYLE", kd: "K/D", adr: "ADR", win: "WIN RATE", recent: "LAST 5", weapon: "TOP WEAPON", kills: "KILLS", damage: "ADR" }
      : { report: "PLAYER REPORT", style: "플레이 스타일", kd: "K/D", adr: "평균 피해", win: "승률", recent: "최근 5경기", weapon: "주력 무기", kills: "킬", damage: "평균 피해" };
    const englishStyles: Record<string, string> = {
      "교전 주도형": "Combat Leader",
      "화력 지원형": "Fire Support",
      "헤드헌터형": "Head Hunter",
      "원거리 견제형": "Long-range Specialist",
      "생존 운영형": "Survival Strategist",
      "기동 운영형": "Mobile Rotator",
      "팀 서포터형": "Team Support",
      "균형 성장형": "Balanced Player",
    };
    const cardStyle = english ? englishStyles[props.styleName] ?? props.styleName : props.styleName;
    const cardWeapon = english && props.topWeapon === "베릴 M762" ? "Beryl M762" : props.topWeapon;

    const gradient = context.createLinearGradient(0, 0, 1200, 630);
    gradient.addColorStop(0, "#f7f7f4");
    gradient.addColorStop(1, "#e8ece8");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 1200, 630);
    context.fillStyle = "#14783f";
    context.fillRect(72, 68, 72, 8);
    context.font = "700 28px Arial, sans-serif";
    context.fillText(`BGI · ${labels.report} · ${props.platform.toUpperCase()}`, 72, 125);
    context.fillStyle = "#171917";
    context.font = "900 74px Arial, sans-serif";
    context.fillText(props.nickname, 72, 225);
    context.fillStyle = "#59605a";
    context.font = "600 25px Arial, sans-serif";
    context.fillText(`${labels.style}  /  ${cardStyle}`, 76, 278);

    const metrics = [
      [labels.kd, props.kd.toFixed(2)],
      [labels.adr, props.adr.toFixed(0)],
      [labels.win, props.winRate],
      [labels.weapon, cardWeapon ?? "—"],
    ];
    metrics.forEach(([label, value], index) => {
      const x = 72 + index * 265;
      context.fillStyle = "#ffffff";
      roundedRect(context, x, 330, 235, 130, 12);
      context.fillStyle = "#6b706a";
      context.font = "700 19px Arial, sans-serif";
      context.fillText(label, x + 22, 372);
      context.fillStyle = "#171917";
      context.font = "900 35px Arial, sans-serif";
      context.fillText(value, x + 22, 424);
    });
    context.fillStyle = "#14783f";
    context.font = "800 22px Arial, sans-serif";
    context.fillText(`${labels.recent}  ·  ${props.recentKills.toFixed(1)} ${labels.kills}  ·  ${props.recentDamage.toFixed(0)} ${labels.damage}`, 72, 525);
    context.fillStyle = "#6b706a";
    context.font = "600 20px Arial, sans-serif";
    context.fillText("bgi.pwkor.com", 72, 574);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) return;
    const file = new File([blob], `BGI-${props.nickname}.png`, { type: "image/png" });
    const shareData = { title: `${props.nickname} PUBG · BGI`, text: `BGI ${cardStyle}`, url: window.location.href, files: [file] };
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share(shareData).catch(() => undefined);
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    link.click();
    URL.revokeObjectURL(url);
    setMessage(english ? "Card saved." : "카드를 저장했습니다.");
  }

  return (
    <section className="player-share-card">
      <div>
        <span>SHARE YOUR BGI</span>
        <h2>{props.nickname} · {props.styleName}</h2>
        <p>K/D {props.kd.toFixed(2)} · ADR {props.adr.toFixed(0)} · {props.topWeapon ?? "BGI PLAYER"}</p>
      </div>
      <button onClick={shareCard} type="button">결과 카드 저장·공유</button>
      {message ? <small role="status">{message}</small> : null}
    </section>
  );
}
