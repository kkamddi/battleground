import { mapCatalog, type MapSlug } from "./mapData";
import type { PubgPlatform } from "./pubg";

type JsonRecord = Record<string, unknown>;

export type ReplayPoint = { x: number; y: number; elapsedSeconds: number };
export type ReplayPlayer = { accountId: string; name: string; subject: boolean; points: ReplayPoint[] };
export type ReplayEvent = { type: "landing" | "kill" | "death" | "revive" | "vehicle"; x: number; y: number; elapsedSeconds: number; label: string };
export type ReplayZone = ReplayPoint & { radius: number };
export type MatchReplay = {
  matchId: string;
  mapSlug: MapSlug;
  mapName: string;
  worldSize: number;
  durationSeconds: number;
  players: ReplayPlayer[];
  events: ReplayEvent[];
  zones: ReplayZone[];
};

const mapIds: Record<string, MapSlug> = {
  Baltic_Main: "erangel",
  Erangel_Main: "erangel",
  Desert_Main: "miramar",
  Tiger_Main: "taego",
  Neon_Main: "rondo",
  DihorOtok_Main: "vikendi",
  Kiki_Main: "deston",
  Savage_Main: "sanhok",
  Summerland_Main: "karakin",
  Chimera_Main: "paramo",
};

function location(character: JsonRecord) {
  const point = (character.location as JsonRecord | undefined) ?? {};
  return { x: Number(point.x ?? 0), y: Number(point.y ?? 0) };
}

function elapsed(event: JsonRecord, startedAt: number) {
  return Math.max(0, Math.round((Date.parse(String(event._D ?? "")) - startedAt) / 1000));
}

async function pubgMatch(platform: PubgPlatform, matchId: string) {
  const key = process.env.PUBG_API_KEY;
  if (!key) throw new Error("PUBG_API_KEY_NOT_CONFIGURED");
  const response = await fetch(`https://api.pubg.com/shards/${platform}/matches/${encodeURIComponent(matchId)}`, {
    headers: { Accept: "application/vnd.api+json", Authorization: `Bearer ${key}` },
    next: { revalidate: 1800 },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`PUBG_API_${response.status}`);
  return response.json() as Promise<JsonRecord>;
}

export async function getMatchReplay(platform: PubgPlatform, matchId: string, subjectAccountId: string): Promise<MatchReplay> {
  const match = await pubgMatch(platform, matchId);
  const data = (match.data as JsonRecord | undefined) ?? {};
  const attributes = (data.attributes as JsonRecord | undefined) ?? {};
  const mapSlug = mapIds[String(attributes.mapName ?? "")];
  if (!mapSlug) throw new Error("MAP_NOT_SUPPORTED");
  const included = (match.included as JsonRecord[] | undefined) ?? [];
  const participantAccounts = new Map<string, { accountId: string; name: string }>();
  for (const item of included) {
    if (item.type !== "participant") continue;
    const stats = ((item.attributes as JsonRecord | undefined)?.stats as JsonRecord | undefined) ?? {};
    participantAccounts.set(String(item.id ?? ""), {
      accountId: String(stats.playerId ?? ""),
      name: String(stats.name ?? "Player"),
    });
  }
  const subjectParticipantId = [...participantAccounts].find(([, player]) => player.accountId === subjectAccountId)?.[0];
  if (!subjectParticipantId) throw new Error("PLAYER_NOT_IN_MATCH");
  const roster = included.find((item) => {
    if (item.type !== "roster") return false;
    const relationships = (item.relationships as JsonRecord | undefined) ?? {};
    const participants = ((relationships.participants as JsonRecord | undefined)?.data as JsonRecord[] | undefined) ?? [];
    return participants.some((participant) => participant.id === subjectParticipantId);
  });
  const relationships = (roster?.relationships as JsonRecord | undefined) ?? {};
  const participantRefs = ((relationships.participants as JsonRecord | undefined)?.data as JsonRecord[] | undefined) ?? [];
  const team = participantRefs.map((participant) => participantAccounts.get(String(participant.id ?? ""))).filter(Boolean) as Array<{ accountId: string; name: string }>;
  const teamIds = new Set(team.map((player) => player.accountId));
  const asset = included.find((item) => item.type === "asset");
  const telemetryUrl = String(((asset?.attributes as JsonRecord | undefined)?.URL as string | undefined) ?? "");
  if (!telemetryUrl) throw new Error("TELEMETRY_NOT_FOUND");
  const telemetryResponse = await fetch(telemetryUrl, { next: { revalidate: 1800 }, signal: AbortSignal.timeout(20_000) });
  if (!telemetryResponse.ok) throw new Error(`TELEMETRY_${telemetryResponse.status}`);
  const telemetry = await telemetryResponse.json() as JsonRecord[];
  const matchStart = telemetry.find((event) => event._T === "LogMatchStart");
  const startedAt = Date.parse(String(matchStart?._D ?? telemetry[0]?._D ?? attributes.createdAt ?? ""));
  const points = new Map(team.map((player) => [player.accountId, [] as ReplayPoint[]]));
  const events: ReplayEvent[] = [];
  const zones: ReplayZone[] = [];

  for (const event of telemetry) {
    const eventType = String(event._T ?? "");
    const eventElapsed = elapsed(event, startedAt);
    if (eventType === "LogPlayerPosition") {
      const character = (event.character as JsonRecord | undefined) ?? {};
      const accountId = String(character.accountId ?? "");
      const route = points.get(accountId);
      if (!route) continue;
      const point = location(character);
      const previous = route.at(-1);
      if (point.x > 0 && point.y > 0 && (!previous || eventElapsed - previous.elapsedSeconds >= 10)) route.push({ ...point, elapsedSeconds: eventElapsed });
    } else if (eventType === "LogParachuteLanding") {
      const character = (event.character as JsonRecord | undefined) ?? {};
      const accountId = String(character.accountId ?? "");
      if (!teamIds.has(accountId)) continue;
      const point = location(character);
      events.push({ type: "landing", ...point, elapsedSeconds: eventElapsed, label: `${String(character.name ?? "Player")} 착륙` });
    } else if (eventType === "LogPlayerKillV2") {
      const killer = (event.killer as JsonRecord | undefined) ?? {};
      const victim = (event.victim as JsonRecord | undefined) ?? {};
      const killerId = String(killer.accountId ?? "");
      const victimId = String(victim.accountId ?? "");
      if (!teamIds.has(killerId) && !teamIds.has(victimId)) continue;
      const character = teamIds.has(victimId) ? victim : killer;
      const point = location(character);
      events.push({
        type: teamIds.has(victimId) ? "death" : "kill",
        ...point,
        elapsedSeconds: eventElapsed,
        label: teamIds.has(victimId) ? `${String(victim.name ?? "Player")} 사망` : `${String(killer.name ?? "Player")} 킬`,
      });
    } else if (eventType === "LogPlayerRevive") {
      const reviver = (event.reviver as JsonRecord | undefined) ?? {};
      if (!teamIds.has(String(reviver.accountId ?? ""))) continue;
      events.push({ type: "revive", ...location(reviver), elapsedSeconds: eventElapsed, label: `${String(reviver.name ?? "Player")} 부활` });
    } else if (eventType === "LogVehicleRide") {
      const character = (event.character as JsonRecord | undefined) ?? {};
      if (!teamIds.has(String(character.accountId ?? ""))) continue;
      events.push({ type: "vehicle", ...location(character), elapsedSeconds: eventElapsed, label: `${String(character.name ?? "Player")} 차량 탑승` });
    } else if (eventType === "LogGameStatePeriodic") {
      const state = (event.gameState as JsonRecord | undefined) ?? {};
      const position = (state.safetyZonePosition as JsonRecord | undefined) ?? {};
      const radius = Number(state.safetyZoneRadius ?? 0);
      const previous = zones.at(-1);
      if (radius > 0 && (!previous || Math.abs(previous.radius - radius) > 100)) {
        zones.push({ x: Number(position.x ?? 0), y: Number(position.y ?? 0), radius, elapsedSeconds: eventElapsed });
      }
    }
  }

  const players = team.map((player) => ({ ...player, subject: player.accountId === subjectAccountId, points: points.get(player.accountId) ?? [] }));
  const durationSeconds = Math.max(1, ...players.flatMap((player) => player.points.map((point) => point.elapsedSeconds)), ...events.map((event) => event.elapsedSeconds));
  return { matchId, mapSlug, mapName: mapCatalog[mapSlug].nameKo, worldSize: mapCatalog[mapSlug].worldSize, durationSeconds, players, events, zones };
}
