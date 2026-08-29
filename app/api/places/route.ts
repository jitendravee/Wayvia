import { NextRequest, NextResponse } from "next/server";
import { getOrCreatePlace } from "@/lib/places/repository";

/**
 * GET /api/places?q=Pune&limit=8
 *
 * Returns canonical Place objects for global city/place discovery.
 * Primary source: countries.dev API
 * Falls back to existing station/bus resolution if needed.
 *
 * The frontend's search box should call THIS for place discovery.
 * Transport-location specific search (e.g. "Pune Junction") should
 * use dedicated endpoints if needed.
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const limit = Math.min(20, Number(req.nextUrl.searchParams.get("limit") ?? "8") || 8);

  if (!q.trim()) {
    return NextResponse.json({ query: q, results: [] });
  }

  // Get or create the place (this will use countries.dev as primary source)
  const place = await getOrCreatePlace(q);

  if (!place) {
    return NextResponse.json({ query: q, results: [] });
  }

  // Return Place-first response - focus on canonical Place information
  // Transport-specific details are available internally but not exposed as primary identity
  const result = {
    id: place.id,
    name: place.name,
    state: place.state,
    country: place.country,
    latitude: place.latitude,
    longitude: place.longitude
  };

  return NextResponse.json({
    query: q,
    results: [result]
  });
}
