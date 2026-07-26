import { unstable_cache } from "next/cache";

const API_ROOT = "https://api.pubg.com/shards/steam";

type JsonRecord = Record<string, unknown>;

export type PlayerModeStats = {
  assists?: number;
  avgRank?: number;
  avgSurvivalTime?: number;
  bestTier?: { tier?: string; subTier?: string };
  currentTier?: { tier?: string; subTier?: string };
  damageDealt?: number;
  deaths?: number;
  headshotKills?: number;
  kda?: number;
  kdr?: number;
  kills?: number;
  longestKill?: number;
  rankPoints?: number;
  roundsPlayed?: number;
  top10Ratio?: number;
  top10s?: number;
  winRatio?: number;
  wins?: number;
};

export type RecentMatch = {
  id: string;
  createdAt: string;
  gameMode: string;
  mapName: string;
  kills: number;
  damage: number;
  placement: number;
  survivalSeconds: number;
};

export type PlayerProfile = {
  accountId: string;
  name: string;
  seasonId: string;
  rankedModes: Record<string, PlayerModeStats>;
  seasonModes: Record<string, PlayerModeStats>;
  recentMatches: RecentMatch[];
};

export class PubgApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function apiJson(path: string, allowNotFound = false): Promise<JsonRecord | null> {
  const key = process.env.PUBG_API_KEY;
  if (!key) throw new PubgApiError("PUBG_API_KEY_NOT_CONFIGURED", 503);

  const response = await fetch(`${API_ROOT}${path}`, {
    headers: {
      Accept: "application/vnd.api+json",
      Authorization: `Bearer ${key}`,
    },
    cache: "no-store",
  });

  if (allowNotFound && response.status === 404) return null;
  if (!response.ok) throw new PubgApiError(`PUBG API ${response.status}`, response.status);
  return response.json();
}

const currentSeason = unstable_cache(
  async () => {
    const payload = await apiJson("/seasons");
    const seasons = (payload?.data as JsonRecord[] | undefined) ?? [];
    const current = seasons.find((season) => {
      const attributes = season.attributes as JsonRecord | undefined;
      return attributes?.isCurrentSeason === true && attributes?.isOffseason !== true;
    });
    if (!current?.id) throw new PubgApiError("CURRENT_SEASON_NOT_FOUND", 502);
    return String(current.id);
  },
  ["pubg-current-season"],
  { revalidate: 2592000 },
);

const lookupPlayer = unstable_cache(
  async (nickname: string) => {
    const search = new URLSearchParams({ "filter[playerNames]": nickname });
    const payload = await apiJson(`/players?${search}`);
    const player = ((payload?.data as JsonRecord[] | undefined) ?? [])[0];
    if (!player?.id) return null;
    const attributes = (player.attributes as JsonRecord | undefined) ?? {};
    const relationships = (player.relationships as JsonRecord | undefined) ?? {};
    const matches = (relationships.matches as JsonRecord | undefined)?.data as JsonRecord[] | undefined;
    return {
      accountId: String(player.id),
      name: String(attributes.name ?? nickname),
      matchIds: (matches ?? []).slice(0, 10).map((match) => String(match.id)),
    };
  },
  ["pubg-player-by-name"],
  { revalidate: 86400 },
);

function modeStats(payload: JsonRecord | null, key: "rankedGameModeStats" | "gameModeStats") {
  const data = (payload?.data as JsonRecord | undefined) ?? {};
  const attributes = (data.attributes as JsonRecord | undefined) ?? {};
  return (attributes[key] as Record<string, PlayerModeStats> | undefined) ?? {};
}

function matchSummary(match: JsonRecord, accountId: string): RecentMatch | null {
  const data = (match.data as JsonRecord | undefined) ?? {};
  const attributes = (data.attributes as JsonRecord | undefined) ?? {};
  const included = (match.included as JsonRecord[] | undefined) ?? [];
  const participant = included.find((item) => {
    if (item.type !== "participant") return false;
    const participantAttributes = (item.attributes as JsonRecord | undefined) ?? {};
    const stats = (participantAttributes.stats as JsonRecord | undefined) ?? {};
    return stats.playerId === accountId;
  });
  if (!participant) return null;
  const participantAttributes = (participant.attributes as JsonRecord | undefined) ?? {};
  const stats = (participantAttributes.stats as JsonRecord | undefined) ?? {};

  return {
    id: String(data.id ?? ""),
    createdAt: String(attributes.createdAt ?? ""),
    gameMode: String(attributes.gameMode ?? "unknown"),
    mapName: String(attributes.mapName ?? "unknown"),
    kills: Number(stats.kills ?? 0),
    damage: Number(stats.damageDealt ?? 0),
    placement: Number(stats.winPlace ?? 0),
    survivalSeconds: Number(stats.timeSurvived ?? 0),
  };
}

const playerStats = unstable_cache(
  async (accountId: string, seasonId: string, matchIds: string[]) => {
    const [ranked, season, matches] = await Promise.all([
      apiJson(`/players/${encodeURIComponent(accountId)}/seasons/${encodeURIComponent(seasonId)}/ranked`, true),
      apiJson(`/players/${encodeURIComponent(accountId)}/seasons/${encodeURIComponent(seasonId)}`, true),
      Promise.all(
        matchIds.map((matchId) =>
          apiJson(`/matches/${encodeURIComponent(matchId)}`, true).catch(() => null),
        ),
      ),
    ]);
    return {
      rankedModes: modeStats(ranked, "rankedGameModeStats"),
      seasonModes: modeStats(season, "gameModeStats"),
      recentMatches: matches
        .filter((match): match is JsonRecord => match !== null)
        .map((match) => matchSummary(match, accountId))
        .filter((match): match is RecentMatch => match !== null),
    };
  },
  ["pubg-player-stats"],
  { revalidate: 600 },
);

export async function getPlayerProfile(nickname: string): Promise<PlayerProfile | null> {
  const normalized = nickname.trim();
  if (normalized.length < 2 || normalized.length > 32) return null;
  const [player, seasonId] = await Promise.all([lookupPlayer(normalized), currentSeason()]);
  if (!player) return null;
  const stats = await playerStats(player.accountId, seasonId, player.matchIds);
  return {
    accountId: player.accountId,
    name: player.name,
    seasonId,
    ...stats,
  };
}
