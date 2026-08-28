import { NextRequest, NextResponse } from "next/server";
import { searchPlaces } from "@/lib/places";

/**
 * GET /api/places?q=Adi&limit=8
 *
 * The frontend's search box should call THIS, not /api/stations. This is
 * the "global search" that suggests every place the multimodal pipeline
 * can actually search from — train stations AND bus-only cities — each
 * tagged with which modes it supports, so /api/stations (train-only) can
 * stay around unchanged for anything that specifically wants just that.
 *
 * The heavy lifting of actually combining train + bus (and, later, flight)
 * results for a route already happens server-side in
 * lib/graph/discoverMultimodal.ts once a search is submitted — this route
 * only has to make sure a place the person wants is *suggestable* in the
 * first place.
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const limit = Math.min(20, Number(req.nextUrl.searchParams.get("limit") ?? "8") || 8);

  const results = await searchPlaces(q, limit);
  return NextResponse.json({ query: q, results });
}
