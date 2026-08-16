import { NextResponse } from "next/server";
import { getMatchReplay } from "../../../../../lib/pubgReplay";
import type { PubgPlatform } from "../../../../../lib/pubg";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request, { params }: { params: Promise<{ platform: string; matchId: string }> }) {
  const { platform, matchId } = await params;
  const accountId = new URL(request.url).searchParams.get("accountId") ?? "";
  if (!(["steam", "kakao"] as string[]).includes(platform) || !/^[a-z0-9_-]{8,100}$/i.test(matchId) || !/^[a-z0-9.:-]{8,150}$/i.test(accountId)) {
    return NextResponse.json({ error: "INVALID_REPLAY_REQUEST" }, { status: 400 });
  }
  try {
    const replay = await getMatchReplay(platform as PubgPlatform, matchId, accountId);
    return NextResponse.json(replay, { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" } });
  } catch (error) {
    console.error("Match replay failed:", error instanceof Error ? error.message : "UNKNOWN_ERROR");
    return NextResponse.json({ error: "REPLAY_UNAVAILABLE" }, { status: 502 });
  }
}
