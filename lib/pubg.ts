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
  assists: number;
  boosts: number;
  dbnos: number;
  headshotKills: number;
  heals: number;
  longestKill: number;
  revives: number;
  rideDistance: number;
  walkDistance: number;
  telemetryUrl?: string;
};

export type WeaponStat = {
  name: string;
  kills: number;
  averageDistance: number;
  longestDistance: number;
};

export type AttachmentStat = {
  name: string;
  equips: number;
};

export type PlayerProfile = {
  accountId: string;
  name: string;
  seasonId: string;
  rankedModes: Record<string, PlayerModeStats>;
  seasonModes: Record<string, PlayerModeStats>;
  recentMatches: RecentMatch[];
  weaponStats: WeaponStat[];
  attachmentStats: AttachmentStat[];
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
  { revalidate: 3600 },
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
  const asset = included.find((item) => item.type === "asset");
  const assetAttributes = (asset?.attributes as JsonRecord | undefined) ?? {};

  return {
    id: String(data.id ?? ""),
    createdAt: String(attributes.createdAt ?? ""),
    gameMode: String(attributes.gameMode ?? "unknown"),
    mapName: String(attributes.mapName ?? "unknown"),
    kills: Number(stats.kills ?? 0),
    damage: Number(stats.damageDealt ?? 0),
    placement: Number(stats.winPlace ?? 0),
    survivalSeconds: Number(stats.timeSurvived ?? 0),
    assists: Number(stats.assists ?? 0),
    boosts: Number(stats.boosts ?? 0),
    dbnos: Number(stats.DBNOs ?? 0),
    headshotKills: Number(stats.headshotKills ?? 0),
    heals: Number(stats.heals ?? 0),
    longestKill: Number(stats.longestKill ?? 0),
    revives: Number(stats.revives ?? 0),
    rideDistance: Number(stats.rideDistance ?? 0),
    walkDistance: Number(stats.walkDistance ?? 0),
    telemetryUrl: typeof assetAttributes.URL === "string" ? assetAttributes.URL : undefined,
  };
}

const itemNames: Record<string, string> = {
  WeapAK47_C: "AKM",
  WeapAUG_C: "AUG",
  WeapBerylM762_C: "베릴 M762",
  WeapG36C_C: "G36C",
  WeapGroza_C: "Groza",
  WeapHK416_C: "M416",
  WeapM16A4_C: "M16A4",
  WeapMk12_C: "Mk12",
  WeapMk14_C: "Mk14",
  WeapMini14_C: "Mini14",
  "WeapSCAR-L_C": "SCAR-L",
  WeapSKS_C: "SKS",
  WeapSLR_C: "SLR",
  WeapACE32_C: "ACE32",
  WeapAWM_C: "AWM",
  WeapKar98k_C: "Kar98k",
  WeapM24_C: "M24",
  WeapMP5K_C: "MP5K",
  WeapP90_C: "P90",
  WeapUMP_C: "UMP45",
  WeapVector_C: "Vector",
  WeapWin94_C: "Win94",
  Item_Attach_Weapon_Lower_AngledForeGrip_C: "앵글 손잡이",
  Item_Attach_Weapon_Lower_HalfGrip_C: "하프 그립",
  Item_Attach_Weapon_Lower_LaserPointer_C: "레이저 사이트",
  Item_Attach_Weapon_Lower_LightweightForeGrip_C: "라이트웨이트 그립",
  Item_Attach_Weapon_Lower_ThumbGrip_C: "엄지 그립",
  Item_Attach_Weapon_Lower_VerticalForeGrip_C: "수직 손잡이",
  Item_Attach_Weapon_Magazine_ExtendedQuickDraw_Large_C: "대용량 퀵드로우 탄창",
  Item_Attach_Weapon_Muzzle_Compensator_Large_C: "보정기",
  Item_Attach_Weapon_Muzzle_Suppressor_Large_C: "소음기",
  Item_Attach_Weapon_Upper_ACOG_01_C: "4배율",
  Item_Attach_Weapon_Upper_CQBSS_C: "8배율",
  Item_Attach_Weapon_Upper_DotSight_01_C: "레드 도트",
  Item_Attach_Weapon_Upper_Scope3x_C: "3배율",
  Item_Attach_Weapon_Upper_Scope6x_C: "6배율",
};

function itemName(value: unknown) {
  const id = String(value ?? "");
  return itemNames[id] ?? id.replace(/^Weap/, "").replace(/^Item_Attach_Weapon_/, "").replace(/_C$/, "");
}

async function telemetryStats(matches: RecentMatch[], accountId: string) {
  const weaponMap = new Map<string, { kills: number; distance: number; longest: number }>();
  const attachmentMap = new Map<string, number>();
  const payloads = await Promise.all(
    matches
      .slice(0, 5)
      .map((match) =>
        match.telemetryUrl
          ? fetch(match.telemetryUrl, { next: { revalidate: 600 } })
              .then((response) => (response.ok ? response.json() : []))
              .catch(() => [])
          : [],
      ),
  );

  for (const events of payloads) {
    if (!Array.isArray(events)) continue;
    for (const rawEvent of events) {
      const event = rawEvent as JsonRecord;
      if (event._T === "LogPlayerKillV2") {
        const killer = (event.killer as JsonRecord | undefined) ?? {};
        if (killer.accountId !== accountId) continue;
        const damageInfo = (event.damageInfo as JsonRecord | undefined) ?? {};
        const name = itemName(damageInfo.damageCauserName);
        if (!name) continue;
        const distance = Number(damageInfo.distance ?? 0) / 100;
        const current = weaponMap.get(name) ?? { kills: 0, distance: 0, longest: 0 };
        current.kills += 1;
        current.distance += distance;
        current.longest = Math.max(current.longest, distance);
        weaponMap.set(name, current);
      }
      if (event._T === "LogItemEquip") {
        const character = (event.character as JsonRecord | undefined) ?? {};
        const item = (event.item as JsonRecord | undefined) ?? {};
        if (character.accountId !== accountId || item.category !== "Attachment") continue;
        const name = itemName(item.itemId);
        if (name) attachmentMap.set(name, (attachmentMap.get(name) ?? 0) + 1);
      }
    }
  }

  return {
    weaponStats: [...weaponMap.entries()]
      .map(([name, value]) => ({
        name,
        kills: value.kills,
        averageDistance: value.kills ? value.distance / value.kills : 0,
        longestDistance: value.longest,
      }))
      .sort((a, b) => b.kills - a.kills),
    attachmentStats: [...attachmentMap.entries()]
      .map(([name, equips]) => ({ name, equips }))
      .sort((a, b) => b.equips - a.equips),
  };
}

const playerStats = unstable_cache(
  async (accountId: string, seasonId: string, matchIds: string[]) => {
    const matchesPromise = Promise.all(
      matchIds.map((matchId) =>
        apiJson(`/matches/${encodeURIComponent(matchId)}`, true).catch(() => null),
      ),
    );
    const ranked = await apiJson(
      `/players/${encodeURIComponent(accountId)}/seasons/${encodeURIComponent(seasonId)}/ranked`,
      true,
    );
    const rankedModes = modeStats(ranked, "rankedGameModeStats");
    const hasRankedGames = Object.values(rankedModes).some(
      (stats) => Number(stats.roundsPlayed ?? 0) > 0,
    );
    const season = hasRankedGames
      ? null
      : await apiJson(
          `/players/${encodeURIComponent(accountId)}/seasons/${encodeURIComponent(seasonId)}`,
          true,
        );
    const matches = await matchesPromise;
    const recentMatches = matches
      .filter((match): match is JsonRecord => match !== null)
      .map((match) => matchSummary(match, accountId))
      .filter((match): match is RecentMatch => match !== null);
    const telemetry = await telemetryStats(recentMatches, accountId);
    return {
      rankedModes,
      seasonModes: modeStats(season, "gameModeStats"),
      recentMatches: recentMatches.map(({ telemetryUrl: _telemetryUrl, ...match }) => match),
      ...telemetry,
    };
  },
  ["pubg-player-stats"],
  { revalidate: 900 },
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
