import { unstable_cache } from "next/cache";
import { mapCatalog, type MapSlug } from "./mapData";
import { getLeaderboard } from "./pubg";

type JsonRecord = Record<string, unknown>;

export type OpeningRoutePoint = { x: number; y: number; elapsedSeconds: number };

export type OpeningRoute = {
  matchId: string;
  playedAt: string;
  playerName: string;
  leaderboardRank: number;
  placement: number;
  points: OpeningRoutePoint[];
};

export type OpeningRouteAnalysis = {
  mapSlug: MapSlug;
  mode: "squad-fpp";
  sampledPlayers: number;
  sampledMatches: number;
  routes: OpeningRoute[];
  endgames: FinalCircleAnalysis[];
  generatedAt: string;
};

export type FinalCircleAnalysis = {
  matchId: string;
  playedAt: string;
  phase: number;
  x: number;
  y: number;
  radius: number;
  alivePlayers: number;
  routes: OpeningRoute[];
};

const mapIds: Record<MapSlug, string[]> = {
  erangel: ["Baltic_Main", "Erangel_Main"],
  miramar: ["Desert_Main"],
  taego: ["Tiger_Main"],
  rondo: ["Neon_Main"],
  vikendi: ["DihorOtok_Main"],
  deston: ["Kiki_Main"],
  sanhok: ["Savage_Main"],
  karakin: ["Summerland_Main"],
  paramo: ["Chimera_Main"],
};

async function pubgJson(path: string) {
  const key = process.env.PUBG_API_KEY;
  if (!key) throw new Error("PUBG_API_KEY_NOT_CONFIGURED");
  const response = await fetch(`https://api.pubg.com/shards/steam${path}`, {
    headers: {
      Accept: "application/vnd.api+json",
      Authorization: `Bearer ${key}`,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`PUBG_API_${response.status}`);
  return response.json() as Promise<JsonRecord>;
}

function playerMatchIds(payload: JsonRecord) {
  const players = (payload.data as JsonRecord[] | undefined) ?? [];
  return players.flatMap((player) => {
    const relationships = (player.relationships as JsonRecord | undefined) ?? {};
    const matches = ((relationships.matches as JsonRecord | undefined)?.data as JsonRecord[] | undefined) ?? [];
    return matches.slice(0, 6).map((match) => String(match.id ?? "")).filter(Boolean);
  });
}

function matchInfo(payload: JsonRecord, accountIds: Set<string>) {
  const data = (payload.data as JsonRecord | undefined) ?? {};
  const attributes = (data.attributes as JsonRecord | undefined) ?? {};
  if (!["competitive", "ranked"].includes(String(attributes.matchType)) || attributes.gameMode !== "squad-fpp") return null;
  const included = (payload.included as JsonRecord[] | undefined) ?? [];
  const asset = included.find((item) => item.type === "asset");
  const telemetryUrl = ((asset?.attributes as JsonRecord | undefined)?.URL as string | undefined) ?? "";
  if (!telemetryUrl) return null;
  const placements = new Map<string, number>();
  for (const item of included) {
    if (item.type !== "participant") continue;
    const stats = ((item.attributes as JsonRecord | undefined)?.stats as JsonRecord | undefined) ?? {};
    const accountId = String(stats.playerId ?? "");
    if (accountIds.has(accountId)) placements.set(accountId, Number(stats.winPlace ?? 0));
  }
  if (!placements.size) return null;
  return {
    id: String(data.id ?? ""),
    playedAt: String(attributes.createdAt ?? ""),
    mapName: String(attributes.mapName ?? ""),
    telemetryUrl,
    placements,
  };
}

function location(character: JsonRecord) {
  const value = (character.location as JsonRecord | undefined) ?? {};
  return { x: Number(value.x ?? 0), y: Number(value.y ?? 0) };
}

async function telemetryAnalysis(
  match: NonNullable<ReturnType<typeof matchInfo>>,
  players: Map<string, { name: string; rank: number }>,
) {
  const response = await fetch(match.telemetryUrl, {
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) return { openingRoutes: [], endgame: null };
  const events = await response.json() as JsonRecord[];
  const landings = new Map<string, { at: number; point: OpeningRoutePoint }>();
  let finalCircle: Omit<FinalCircleAnalysis, "matchId" | "playedAt" | "routes"> | null = null;

  for (const event of events) {
    if (event._T === "LogGameStatePeriodic") {
      const gameState = (event.gameState as JsonRecord | undefined) ?? {};
      const center = (gameState.safetyZonePosition as JsonRecord | undefined) ?? {};
      const radius = Number(gameState.safetyZoneRadius ?? 0);
      const x = Number(center.x ?? 0);
      const y = Number(center.y ?? 0);
      if (radius > 0 && x > 0 && y > 0 && (!finalCircle || radius <= finalCircle.radius)) {
        finalCircle = {
          phase: Math.floor(Number(((event.common as JsonRecord | undefined)?.isGame) ?? 0)),
          x,
          y,
          radius,
          alivePlayers: Number(gameState.numAlivePlayers ?? 0),
        };
      }
    }
    if (event._T !== "LogParachuteLanding") continue;
    const character = (event.character as JsonRecord | undefined) ?? {};
    const accountId = String(character.accountId ?? "");
    if (!players.has(accountId)) continue;
    const at = Date.parse(String(event._D ?? ""));
    const point = location(character);
    if (Number.isFinite(at) && point.x > 0 && point.y > 0) {
      landings.set(accountId, { at, point: { ...point, elapsedSeconds: 0 } });
    }
  }

  const pointsByPlayer = new Map<string, OpeningRoutePoint[]>();
  const latePointsByPlayer = new Map<string, OpeningRoutePoint[]>();
  for (const event of events) {
    if (event._T !== "LogPlayerPosition") continue;
    const character = (event.character as JsonRecord | undefined) ?? {};
    const accountId = String(character.accountId ?? "");
    const landing = landings.get(accountId);
    if (!landing) continue;
    const at = Date.parse(String(event._D ?? ""));
    const elapsedSeconds = Math.round((at - landing.at) / 1000);
    const point = location(character);
    if (point.x <= 0 || point.y <= 0) continue;

    const phase = Number(((event.common as JsonRecord | undefined)?.isGame) ?? 0);
    if (phase >= 3) {
      const lateRoute = latePointsByPlayer.get(accountId) ?? [];
      const matchElapsed = Math.round(Number(event.elapsedTime ?? 0));
      const previousLate = lateRoute.at(-1);
      if (!previousLate || matchElapsed - previousLate.elapsedSeconds >= 20) {
        lateRoute.push({ ...point, elapsedSeconds: matchElapsed });
        latePointsByPlayer.set(accountId, lateRoute);
      }
    }

    if (elapsedSeconds < 0 || elapsedSeconds > 600) continue;
    const route = pointsByPlayer.get(accountId) ?? [landing.point];
    const previous = route.at(-1)!;
    if (elapsedSeconds - previous.elapsedSeconds >= 20 || elapsedSeconds === 600) {
      route.push({ ...point, elapsedSeconds });
      pointsByPlayer.set(accountId, route);
    }
  }

  const toRoutes = (entries: IterableIterator<[string, OpeningRoutePoint[]]>) => [...entries]
    .filter(([, points]) => points.length >= 3)
    .map(([accountId, points]) => ({
      matchId: match.id,
      playedAt: match.playedAt,
      playerName: players.get(accountId)!.name,
      leaderboardRank: players.get(accountId)!.rank,
      placement: match.placements.get(accountId) ?? 0,
      points,
    } satisfies OpeningRoute));

  const openingRoutes = toRoutes(pointsByPlayer.entries());
  const lateRoutes = toRoutes(latePointsByPlayer.entries());
  return {
    openingRoutes,
    endgame: finalCircle ? {
      matchId: match.id,
      playedAt: match.playedAt,
      ...finalCircle,
      routes: lateRoutes,
    } satisfies FinalCircleAnalysis : null,
  };
}

const cachedAnalysis = unstable_cache(
  async (mapSlug: MapSlug): Promise<OpeningRouteAnalysis> => {
    const definition = mapCatalog[mapSlug];
    if (!definition.ranked) {
      return { mapSlug, mode: "squad-fpp", sampledPlayers: 0, sampledMatches: 0, routes: [], endgames: [], generatedAt: new Date().toISOString() };
    }

    const leaderboard = await getLeaderboard("steam", "squad-fpp");
    const players = new Map(leaderboard.map((player) => [player.accountId, { name: player.name, rank: player.rank }]));
    const search = new URLSearchParams({ "filter[playerIds]": [...players.keys()].join(",") });
    const playerPayload = await pubgJson(`/players?${search}`);
    const matchIds = [...new Set(playerMatchIds(playerPayload))];
    const accountIds = new Set(players.keys());
    const matchPayloads = await Promise.all(
      matchIds.map((matchId) => pubgJson(`/matches/${encodeURIComponent(matchId)}`).catch(() => null)),
    );
    const matching = matchPayloads
      .filter((payload): payload is JsonRecord => payload !== null)
      .map((payload) => matchInfo(payload, accountIds))
      .filter((match): match is NonNullable<ReturnType<typeof matchInfo>> => (
        match !== null && mapIds[mapSlug].includes(match.mapName)
      ))
      .slice(0, 18);
    const telemetry = await Promise.all(matching.map((match) => telemetryAnalysis(match, players)));
    const routes = telemetry
      .flatMap((analysis) => analysis.openingRoutes)
      .slice(0, 24);
    const endgames = telemetry
      .map((analysis) => analysis.endgame)
      .filter((analysis): analysis is FinalCircleAnalysis => analysis !== null);

    return {
      mapSlug,
      mode: "squad-fpp",
      sampledPlayers: players.size,
      sampledMatches: matching.length,
      routes,
      endgames,
      generatedAt: new Date().toISOString(),
    };
  },
  ["pubg-ranked-opening-routes-v2"],
  { revalidate: 21_600 },
);

export function getRankedOpeningRoutes(mapSlug: MapSlug) {
  return cachedAnalysis(mapSlug);
}
