type ComparisonRow = {
  subject_key: string;
  metric: string;
  before_value: number | null;
  after_value: number | null;
  change_percent: number | null;
  sample_matches_before: number;
  sample_matches_after: number;
};

type LoadoutRow = {
  weapon_key: string;
  attachment_keys: string[];
  loadout_hash: string;
  kill_count: number;
};

type PlayerRow = {
  player_name: string;
  rank_value: number;
  weapon_key: string;
  attachment_keys: string[];
  sample_matches: number;
  snapshot_date: string;
};

const weaponAliases: Record<string, string> = {
  WeapAK47: "AKM",
  WeapAWM: "AWM",
  WeapHK416: "M416",
  WeapKar98k: "Kar98k",
  WeapMP5K: "MP5K",
  WeapMk12: "Mk12",
  Item_Weapon_HK416_C: "M416",
  Item_Weapon_AUG_C: "AUG",
  Item_Weapon_BerylM762_C: "Beryl M762",
  Item_Weapon_ACE32_C: "ACE32",
  Item_Weapon_MP5K_C: "MP5K",
  Item_Weapon_UMP_C: "UMP45",
  Item_Weapon_FNFal_C: "SLR",
};

const attachmentAliases: Record<string, string> = {
  LowerThumbGrip: "엄지 그립",
  LowerTiltedGrip: "틸티드 그립",
  Lower_Foregrip: "수직 손잡이",
  Lower_ThumbGrip: "엄지 그립",
  Lower_TiltedGrip: "틸티드 그립",
  Magazine_Extended_Large: "대용량 탄창",
  Magazine_Extended_Medium: "대용량 탄창",
  Magazine_Extended_SniperRifle: "저격소총용 대용량 탄창",
  Magazine_ExtendedQuickDraw_Large: "대용량 퀵드로우 탄창",
  Magazine_ExtendedQuickDraw_Medium: "대용량 퀵드로우 탄창",
  Magazine_QuickDraw_Large: "퀵드로우 탄창",
  Muzzle_AR_MuzzleBrake: "총구 제동기",
  Muzzle_Compensator_Medium: "보정기",
  Muzzle_FlashHider_Large: "소염기",
  Muzzle_Suppressor_SniperRifle: "저격소총용 소음기",
  Stock_AR_HeavyStock: "중량형 개머리판",
  Stock_AR_HeavyStock_C: "중량형 개머리판",
  Stock_SniperRifle_CheekPad: "칙패드",
  Upper_CQBSS: "6배율 스코프",
  Upper_DotSight_01: "레드 도트 사이트",
  Upper_DualOptic_4x1x: "4배율 스코프",
  Upper_Scope3x: "3배율 스코프",
  Upper_Scope6x: "6배율 스코프",
  Item_Attach_Weapon_Muzzle_Compensator_Large_C: "보정기",
  Item_Attach_Weapon_Muzzle_Suppressor_Large_C: "소음기",
  Item_Attach_Weapon_Upper_VerticalForeGrip_C: "수직 손잡이",
  Item_Attach_Weapon_Upper_AngledForeGrip_C: "앵글 손잡이",
  Item_Attach_Weapon_Upper_HalfGrip_C: "하프 그립",
  Item_Attach_Weapon_Upper_LightweightForeGrip_C: "라이트웨이트 그립",
  Item_Attach_Weapon_Lower_ExtendedQuickDrawMag_Large_C: "대용량 퀵드로우",
  Item_Attach_Weapon_Stock_AR_Composite_C: "전술 개머리판",
};

function label(value: string, aliases: Record<string, string>) {
  const normalized = value.replace(/_C$/, "");
  const itemName = normalized.replace(/^Item_(Weapon|Attach_Weapon)_/, "");
  return aliases[value] ?? aliases[normalized] ?? aliases[itemName] ?? itemName.replaceAll("_", " ");
}

async function query<T>(table: string, search: URLSearchParams): Promise<T[]> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return [];
  const response = await fetch(`${url}/rest/v1/${table}?${search}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    next: { revalidate: 900 },
  });
  if (!response.ok) throw new Error(`Supabase ${table} query failed`);
  return response.json();
}

function percent(value: number | null) {
  return value === null ? "—" : `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export default async function LiveMetaPanels() {
  const since = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  try {
    const [comparisons, loadouts, players] = await Promise.all([
      query<ComparisonRow>("patch_meta_comparisons", new URLSearchParams({
        select: "subject_key,metric,before_value,after_value,change_percent,sample_matches_before,sample_matches_after",
        order: "generated_at.desc",
        limit: "6",
      })),
      query<LoadoutRow>("daily_loadout_stats", new URLSearchParams({
        select: "weapon_key,attachment_keys,loadout_hash,kill_count",
        stat_date: `gte.${since}`,
        order: "kill_count.desc",
        limit: "1000",
      })),
      query<PlayerRow>("top_player_loadouts", new URLSearchParams({
        select: "player_name,rank_value,weapon_key,attachment_keys,sample_matches,snapshot_date",
        source_kind: "eq.official_leaderboard_recent_match",
        sample_matches: "gte.2",
        order: "snapshot_date.desc,rank_value.asc",
        limit: "20",
      })),
    ]);

    const combined = new Map<string, LoadoutRow>();
    for (const row of loadouts.filter((item) => item.weapon_key !== "unknown" && item.attachment_keys.length >= 2)) {
      const key = `${row.weapon_key}:${row.loadout_hash}`;
      const current = combined.get(key);
      combined.set(key, current ? { ...current, kill_count: current.kill_count + row.kill_count } : row);
    }
    const rankedLoadouts = [...combined.values()].sort((a, b) => b.kill_count - a.kill_count).slice(0, 6);
    const totalLoadoutKills = [...combined.values()].reduce((sum, row) => sum + row.kill_count, 0);
    const representativePlayers = players.filter((row) => row.attachment_keys.length >= 2);

    return (
      <section className="live-meta">
        <div className="home-section-head">
          <div><span>최근 7일 실전 표본</span><h2>실전 메타</h2></div>
          <p>Steam 공식 API 표본 기준 · 매일 갱신</p>
        </div>
        <div className="live-meta-grid">
          <article>
            <span>패치 영향</span>
            <h3>패치 전후 총기 사용 변화</h3>
            {comparisons.length ? (
              <ul>{comparisons.map((row) => <li key={`${row.metric}-${row.subject_key}`}><strong>{label(row.subject_key, weaponAliases)}</strong><b className={(row.change_percent ?? 0) >= 0 ? "positive" : "negative"}>{percent(row.change_percent)}</b><small>전 {row.sample_matches_before} · 후 {row.sample_matches_after}매치</small></li>)}</ul>
            ) : <div className="collection-empty"><strong>표본 수집 중</strong><p>패치 적용 전후 7일치가 확보되면 사용률 변화를 표시합니다.</p></div>}
          </article>
          <article>
            <span>파츠 조합</span>
            <h3>킬 발생 당시 장착 조합</h3>
            {rankedLoadouts.length ? (
              <ul>{rankedLoadouts.map((row) => <li key={`${row.weapon_key}-${row.loadout_hash}`}><strong>{label(row.weapon_key, weaponAliases)}</strong><b>{totalLoadoutKills ? ((row.kill_count / totalLoadoutKills) * 100).toFixed(1) : "0.0"}%</b><small>{row.attachment_keys.map((item) => label(item, attachmentAliases)).join(" · ") || "파츠 없음"}</small></li>)}</ul>
            ) : <div className="collection-empty"><strong>표본 수집 중</strong><p>킬 당시 장착 정보가 확인된 조합부터 순차적으로 표시합니다.</p></div>}
          </article>
          <article>
            <span>경쟁전 상위권</span>
            <h3>상위 플레이어 최근 세팅</h3>
            {representativePlayers.length ? (
              <ul>{representativePlayers.slice(0, 6).map((row) => <li key={`${row.player_name}-${row.weapon_key}`}><strong>#{row.rank_value} {row.player_name}</strong><b>{label(row.weapon_key, weaponAliases)}</b><small>{row.attachment_keys.map((item) => label(item, attachmentAliases)).join(" · ")} · 해당 총기 {row.sample_matches}경기 관측</small></li>)}</ul>
            ) : <div className="collection-empty"><strong>대표 세팅 수집 중</strong><p>최근 경쟁전에서 2경기 이상 사용된 총기의 선호 파츠를 집계합니다.</p></div>}
          </article>
        </div>
        <p className="live-meta-note">표본 매치에서 확인된 결과이며 전체 이용자 통계가 아닙니다. 파츠 비중은 킬 당시 장착 정보가 확인된 조합끼리 비교합니다.</p>
      </section>
    );
  } catch {
    return <section className="live-meta unavailable"><strong>실전 메타</strong><p>데이터를 갱신하고 있습니다. 잠시 후 다시 확인해 주세요.</p></section>;
  }
}
