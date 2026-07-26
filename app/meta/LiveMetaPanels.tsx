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
  snapshot_date: string;
};

const weaponAliases: Record<string, string> = {
  Item_Weapon_HK416_C: "M416",
  Item_Weapon_AUG_C: "AUG",
  Item_Weapon_BerylM762_C: "Beryl M762",
  Item_Weapon_ACE32_C: "ACE32",
  Item_Weapon_MP5K_C: "MP5K",
  Item_Weapon_UMP_C: "UMP45",
  Item_Weapon_FNFal_C: "SLR",
};

const attachmentAliases: Record<string, string> = {
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
  return aliases[value] ?? value.replace(/^Item_(Weapon|Attach_Weapon)_/, "").replace(/_C$/, "").replaceAll("_", " ");
}

async function query<T>(table: string, search: URLSearchParams): Promise<T[]> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return [];
  const response = await fetch(`${url}/rest/v1/${table}?${search}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    next: { revalidate: 3600 },
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
        select: "player_name,rank_value,weapon_key,attachment_keys,snapshot_date",
        source_kind: "eq.official_leaderboard_recent_match",
        order: "snapshot_date.desc,rank_value.asc",
        limit: "20",
      })),
    ]);

    const combined = new Map<string, LoadoutRow>();
    for (const row of loadouts) {
      const key = `${row.weapon_key}:${row.loadout_hash}`;
      const current = combined.get(key);
      combined.set(key, current ? { ...current, kill_count: current.kill_count + row.kill_count } : row);
    }
    const rankedLoadouts = [...combined.values()].sort((a, b) => b.kill_count - a.kill_count).slice(0, 6);
    const totalLoadoutKills = [...combined.values()].reduce((sum, row) => sum + row.kill_count, 0);

    return (
      <section className="live-meta">
        <div className="home-section-head">
          <div><span>BGI TELEMETRY · RECENT 7 DAYS</span><h2>자동 수집 메타</h2></div>
          <p>공식 API 표본 매치 기준이며 전체 이용자 통계가 아닙니다.</p>
        </div>
        <div className="live-meta-grid">
          <article>
            <span>PATCH IMPACT</span>
            <h3>패치 전후 사용 관여율</h3>
            {comparisons.length ? (
              <ul>{comparisons.map((row) => <li key={`${row.metric}-${row.subject_key}`}><strong>{label(row.subject_key, weaponAliases)}</strong><b className={(row.change_percent ?? 0) >= 0 ? "positive" : "negative"}>{percent(row.change_percent)}</b><small>전 {row.sample_matches_before} · 후 {row.sample_matches_after}매치</small></li>)}</ul>
            ) : <p className="collection-empty">승인된 패치의 적용 후 7일 표본이 쌓이면 자동 표시됩니다.</p>}
          </article>
          <article>
            <span>ATTACHMENT KILL SHARE</span>
            <h3>킬 발생 당시 파츠 조합</h3>
            {rankedLoadouts.length ? (
              <ul>{rankedLoadouts.map((row) => <li key={`${row.weapon_key}-${row.loadout_hash}`}><strong>{label(row.weapon_key, weaponAliases)}</strong><b>{totalLoadoutKills ? ((row.kill_count / totalLoadoutKills) * 100).toFixed(1) : "0.0"}%</b><small>{row.attachment_keys.map((item) => label(item, attachmentAliases)).join(" · ") || "파츠 없음"}</small></li>)}</ul>
            ) : <p className="collection-empty">PUBG API 키를 연결하고 첫 일일 수집이 끝나면 표시됩니다.</p>}
          </article>
          <article>
            <span>OFFICIAL LEADERBOARD SAMPLE</span>
            <h3>상위 순위 플레이어 최근 세팅</h3>
            {players.length ? (
              <ul>{players.slice(0, 6).map((row) => <li key={`${row.player_name}-${row.weapon_key}`}><strong>#{row.rank_value} {row.player_name}</strong><b>{label(row.weapon_key, weaponAliases)}</b><small>{row.attachment_keys.map((item) => label(item, attachmentAliases)).join(" · ") || "파츠 없음"}</small></li>)}</ul>
            ) : <p className="collection-empty">공식 리더보드 상위 10명의 최근 매치 세팅을 일일 수집할 준비가 완료되었습니다.</p>}
          </article>
        </div>
        <p className="live-meta-note">사용 관여율은 표본 매치에서 해당 총기가 관측된 플레이어 비중입니다. 파츠 킬 점유율은 텔레메트리의 킬 당시 장착 정보가 확인된 조합끼리 비교합니다.</p>
      </section>
    );
  } catch {
    return <section className="live-meta unavailable"><strong>자동 수집 메타</strong><p>데이터 저장소 연결을 확인하고 있습니다. 기존 시즌 42 표본은 위에서 계속 확인할 수 있습니다.</p></section>;
  }
}

