import { NextResponse } from "next/server";
import { mapCatalog, mapSlugs, type MapSlug } from "../../../../lib/mapData";
import { getRankedOpeningRoutes } from "../../../../lib/pubgRoutes";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!mapSlugs.includes(slug as MapSlug)) {
    return NextResponse.json({ error: "MAP_NOT_FOUND" }, { status: 404 });
  }
  if (!mapCatalog[slug as MapSlug].ranked) {
    return NextResponse.json({ error: "RANKED_NOT_AVAILABLE" }, { status: 400 });
  }

  try {
    const analysis = await getRankedOpeningRoutes(slug as MapSlug);
    return NextResponse.json(analysis, {
      headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" },
    });
  } catch (error) {
    console.error("Opening route analysis failed:", error instanceof Error ? error.message : "UNKNOWN_ERROR");
    return NextResponse.json({ error: "ROUTE_ANALYSIS_UNAVAILABLE" }, { status: 502 });
  }
}
