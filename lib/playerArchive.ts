import type { PlayerModeStats, PlayerProfile } from "./pubg";

function configured() {
  return Boolean(
    process.env.SUPABASE_URL &&
    (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY),
  );
}

export type PlayerBenchmark = {
  sampleSize: number;
  metrics: Array<{ label: string; topPercent: number; value: number }>;
};

function benchmarkValue(stats: PlayerModeStats) {
  const rounds = Number(stats.roundsPlayed ?? 0);
  const wins = Number(stats.wins ?? 0);
  const kills = Number(stats.kills ?? 0);
  const deaths = Math.max(rounds - wins, 1);
  return {
    kd: Number(stats.kdr ?? 0) || kills / deaths,
    adr: rounds ? Number(stats.damageDealt ?? 0) / rounds : 0,
    winRate: Number(stats.winRatio ?? (rounds ? wins / rounds : 0)),
    top10Rate: Number(stats.top10Ratio ?? (rounds ? Number(stats.top10s ?? 0) / rounds : 0)),
  };
}

export async function getPlayerBenchmark(
  profile: PlayerProfile,
  modeKey: string,
  ranked: boolean,
): Promise<PlayerBenchmark | null> {
  if (!configured()) return null;
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const column = ranked ? "ranked_modes" : "season_modes";
  const search = new URLSearchParams({
    select: column,
    platform: `eq.${profile.platform}`,
    season_id: `eq.${profile.seasonId}`,
    limit: "500",
  });
  try {
    const response = await fetch(`${url}/rest/v1/player_season_stats?${search}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { revalidate: 3600 },
    });
    if (!response.ok) return null;
    const rows = await response.json() as Array<Record<string, Record<string, PlayerModeStats>>>;
    const sample = rows
      .map((row) => row[column]?.[modeKey])
      .filter((stats): stats is PlayerModeStats => Boolean(stats) && Number(stats.roundsPlayed ?? 0) >= 5)
      .map(benchmarkValue);
    if (sample.length < 30) return null;
    const currentStats = (ranked ? profile.rankedModes : profile.seasonModes)[modeKey];
    if (!currentStats) return null;
    const current = benchmarkValue(currentStats);
    const topPercent = (value: number, values: number[]) => {
      const better = values.filter((sampleValue) => sampleValue > value).length;
      return Math.max(1, Math.ceil(((better + 1) / (values.length + 1)) * 100));
    };
    return {
      sampleSize: sample.length,
      metrics: [
        { label: "K/D", value: current.kd, topPercent: topPercent(current.kd, sample.map((value) => value.kd)) },
        { label: "ADR", value: current.adr, topPercent: topPercent(current.adr, sample.map((value) => value.adr)) },
        { label: "승률", value: current.winRate, topPercent: topPercent(current.winRate, sample.map((value) => value.winRate)) },
        { label: "Top 10", value: current.top10Rate, topPercent: topPercent(current.top10Rate, sample.map((value) => value.top10Rate)) },
      ],
    };
  } catch {
    return null;
  }
}

async function upsert(
  table: string,
  conflictColumns: string,
  rows: Record<string, unknown>[],
) {
  if (!rows.length) return;
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const search = new URLSearchParams({ on_conflict: conflictColumns });
  const response = await fetch(`${url}/rest/v1/${table}?${search}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`PLAYER_ARCHIVE_${table}_${response.status}`);
  }
}

export async function archivePlayerProfile(profile: PlayerProfile) {
  if (!configured()) return;

  const now = new Date();
  const refreshUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const snapshotDate = `${now.toISOString().slice(0, 7)}-01`;
  const identity = {
    platform: profile.platform,
    account_id: profile.accountId,
  };

  try {
    await upsert("tracked_players", "platform,account_id", [{
      ...identity,
      player_name: profile.name,
      tracking_status: "active",
      last_seen_at: now.toISOString(),
      last_searched_at: now.toISOString(),
      refresh_until: refreshUntil.toISOString(),
    }]);

    await Promise.all([
      upsert("player_season_stats", "platform,account_id,season_id", [{
        ...identity,
        season_id: profile.seasonId,
        ranked_modes: profile.rankedModes,
        season_modes: profile.seasonModes,
        captured_at: now.toISOString(),
        updated_at: now.toISOString(),
      }]),
      upsert("player_match_history", "platform,account_id,match_id",
        profile.recentMatches.map((match) => ({
          ...identity,
          match_id: match.id,
          played_at: match.createdAt,
          game_mode: match.gameMode,
          map_name: match.mapName,
          kills: match.kills,
          damage: match.damage,
          placement: match.placement,
          survival_seconds: match.survivalSeconds,
          assists: match.assists,
          boosts: match.boosts,
          dbnos: match.dbnos,
          headshot_kills: match.headshotKills,
          heals: match.heals,
          longest_kill: match.longestKill,
          revives: match.revives,
          ride_distance: match.rideDistance,
          walk_distance: match.walkDistance,
          captured_at: now.toISOString(),
      }))),
      upsert("player_report_snapshots", "snapshot_date,platform,account_id", [{
        snapshot_date: snapshotDate,
        ...identity,
        weapon_stats: profile.weaponStats,
        attachment_stats: profile.attachmentStats,
        kill_loadout_stats: profile.killLoadoutStats,
        recent_match_count: profile.recentMatches.length,
        updated_at: now.toISOString(),
      }]),
    ]);
  } catch (error) {
    console.error(
      "Player archive failed:",
      error instanceof Error ? error.message : "UNKNOWN_ERROR",
    );
  }
}
