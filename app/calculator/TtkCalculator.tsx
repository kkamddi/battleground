"use client";

import { useMemo, useState } from "react";

type Weapon = {
  name: string;
  category: string;
  damage: number;
  rpm: number;
  falloffStart: number;
  falloffEnd: number;
  minimumMultiplier: number;
};

const weapons: Weapon[] = [
  { name: "AUG", category: "AR", damage: 40, rpm: 750, falloffStart: 70, falloffEnd: 450, minimumMultiplier: 0.55 },
  { name: "M416", category: "AR", damage: 40, rpm: 700, falloffStart: 60, falloffEnd: 445, minimumMultiplier: 0.55 },
  { name: "Beryl M762", category: "AR", damage: 44, rpm: 700, falloffStart: 60, falloffEnd: 445, minimumMultiplier: 0.55 },
  { name: "ACE32", category: "AR", damage: 43, rpm: 680, falloffStart: 60, falloffEnd: 445, minimumMultiplier: 0.55 },
  { name: "AKM", category: "AR", damage: 48, rpm: 600, falloffStart: 60, falloffEnd: 445, minimumMultiplier: 0.55 },
  { name: "MP5K", category: "SMG", damage: 32, rpm: 900, falloffStart: 35, falloffEnd: 250, minimumMultiplier: 0.55 },
  { name: "UMP45", category: "SMG", damage: 42, rpm: 670, falloffStart: 30, falloffEnd: 250, minimumMultiplier: 0.55 },
  { name: "Mini14", category: "DMR", damage: 42, rpm: 600, falloffStart: 90, falloffEnd: 500, minimumMultiplier: 0.70 },
  { name: "Mk12", category: "DMR", damage: 43, rpm: 600, falloffStart: 90, falloffEnd: 500, minimumMultiplier: 0.70 },
  { name: "SLR", category: "DMR", damage: 49, rpm: 600, falloffStart: 100, falloffEnd: 500, minimumMultiplier: 0.70 },
];

const armorReduction = [0, 0.3, 0.4, 0.55];
const chartDistances = [0, 25, 50, 75, 100, 150, 200, 250, 300];

function multiplierAtDistance(weapon: Weapon, distance: number) {
  if (distance <= weapon.falloffStart) return 1;
  if (distance >= weapon.falloffEnd) return weapon.minimumMultiplier;
  const progress = (distance - weapon.falloffStart) / (weapon.falloffEnd - weapon.falloffStart);
  return 1 - progress * (1 - weapon.minimumMultiplier);
}

function result(weapon: Weapon, distance: number, armor: number) {
  const damage = weapon.damage * multiplierAtDistance(weapon, distance) * (1 - armorReduction[armor]);
  const shots = Math.ceil(100 / damage);
  const ttk = ((shots - 1) * 60 * 1000) / weapon.rpm;
  return { damage, shots, ttk, dps: (weapon.damage * weapon.rpm) / 60 };
}

function linePoints(weapon: Weapon, armor: number) {
  return chartDistances.map((distance, index) => {
    const damage = result(weapon, distance, armor).damage;
    const x = 35 + (index / (chartDistances.length - 1)) * 665;
    const y = 210 - (Math.min(damage, 60) / 60) * 170;
    return `${x},${y}`;
  }).join(" ");
}

export default function TtkCalculator() {
  const [firstName, setFirstName] = useState("M416");
  const [secondName, setSecondName] = useState("AUG");
  const [distance, setDistance] = useState(50);
  const [armor, setArmor] = useState(2);
  const first = weapons.find((weapon) => weapon.name === firstName) ?? weapons[0];
  const second = weapons.find((weapon) => weapon.name === secondName) ?? weapons[1];
  const rows = useMemo(() => [first, second].map((weapon) => ({ weapon, ...result(weapon, distance, armor) })), [first, second, distance, armor]);

  return (
    <section className="calculator-panel">
      <div className="calculator-controls">
        <label>총기 A<select value={firstName} onChange={(event) => setFirstName(event.target.value)}>{weapons.map((weapon) => <option key={weapon.name}>{weapon.name}</option>)}</select></label>
        <label>총기 B<select value={secondName} onChange={(event) => setSecondName(event.target.value)}>{weapons.map((weapon) => <option key={weapon.name}>{weapon.name}</option>)}</select></label>
        <label>방탄복<select value={armor} onChange={(event) => setArmor(Number(event.target.value))}><option value={0}>없음</option><option value={1}>Lv.1</option><option value={2}>Lv.2</option><option value={3}>Lv.3</option></select></label>
        <label className="distance-control"><span>거리 <b>{distance}m</b></span><input type="range" min="0" max="300" step="5" value={distance} onChange={(event) => setDistance(Number(event.target.value))} /></label>
      </div>

      <div className="calculator-results">
        {rows.map(({ weapon, damage, shots, ttk, dps }, index) => (
          <article key={`${weapon.name}-${index}`}>
            <span>{weapon.category} · {index === 0 ? "A" : "B"}</span>
            <h2>{weapon.name}</h2>
            <dl>
              <div><dt>1발 피해량</dt><dd>{damage.toFixed(1)}</dd></div>
              <div><dt>필요 탄수</dt><dd>{shots}발</dd></div>
              <div><dt>이론상 TTK</dt><dd>{Math.round(ttk)}ms</dd></div>
              <div><dt>기본 DPS</dt><dd>{Math.round(dps)}</dd></div>
            </dl>
          </article>
        ))}
      </div>

      <div className="damage-chart">
        <div><span>DISTANCE DAMAGE</span><h2>거리별 몸샷 피해 감소</h2></div>
        <svg viewBox="0 0 730 250" role="img" aria-label={`${first.name}와 ${second.name} 거리별 피해 비교 그래프`}>
          {[40, 125, 210].map((y) => <line key={y} x1="35" y1={y} x2="700" y2={y} />)}
          <polyline className="line-a" points={linePoints(first, armor)} />
          <polyline className="line-b" points={linePoints(second, armor)} />
          {chartDistances.map((value, index) => <text key={value} x={35 + (index / 8) * 665} y="235" textAnchor="middle">{value}m</text>)}
        </svg>
        <p><i className="legend-a" />{first.name}<i className="legend-b" />{second.name}</p>
      </div>

      <aside className="calculation-notice">
        <strong>계산 기준</strong>
        <p>체력 100, 몸통 명중, 발사 간격이 일정한 이론값입니다. 방탄복 감소율과 공개·검증 자료를 바탕으로 한 거리 감쇠 근사치를 사용하며, 실제 서버 수치·피격 부위·방어구 내구도에 따라 달라질 수 있습니다.</p>
      </aside>
    </section>
  );
}

