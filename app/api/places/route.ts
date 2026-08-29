import { NextRequest, NextResponse } from "next/server";
import type { CountriesDevCityResponse } from "@/lib/places/countriesDev";
import { normalizeCountriesDevPlace } from "@/lib/places/countriesDev";

/**
 * GET /api/places?q=Pune&limit=8
 *
 * Returns canonical Place objects for global city/place discovery.
 * Uses ONLY countries.dev as the source for autocomplete suggestions.
 * No fallbacks to transport providers (eRail, Ixigo, etc.) for suggestions.
 *
 * The frontend's search box should call THIS for place discovery.
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const limit = Math.min(20, Number(req.nextUrl.searchParams.get("limit") ?? "8") || 8);

  if (!q.trim()) {
    return NextResponse.json({ query: q, results: [] });
  }

  try {
    // Ask countries.dev for more than we need — most results outside
    // India will get filtered out below, so requesting `limit` alone would
    // often leave us with too few (or zero) results after filtering.
    const upstreamLimit = Math.min(50, limit * 4);
    // `country=IN` is passed in case countries.dev honors it, but we don't
    // rely on it — the explicit filter below is the actual guarantee.
    const url = `https://countries.dev/cities?q=${encodeURIComponent(q.trim())}&limit=${upstreamLimit}&country=IN`;
    const res = await fetch(url);

    // Treat 404 as "no results found" rather than an error
    if (!res.ok && res.status !== 404) {
      return NextResponse.json(
        { query: q, results: [], error: "Failed to fetch place suggestions" },
        { status: 500 }
      );
    }

    // If we get a 404 or non-JSON response, return empty array
    if (res.status === 404) {
      return NextResponse.json({ query: q, results: [] });
    }

    const data = await res.json() as CountriesDevCityResponse[];

    // Hard guarantee India-only results regardless of whether the
    // upstream `country` param above was actually honored.
    const indiaOnly = data.filter((city) => city.countryCode === "IN");

    // Normalize each city to our Place model
    const results = indiaOnly
      .slice(0, limit)
      .map((city) => normalizeCountriesDevPlace(city, q.trim()));

    return NextResponse.json({
      query: q,
      results
    });
  } catch (error) {
    console.error("Error in /api/places route:", error);
    return NextResponse.json(
      { query: q, results: [], error: "Internal server error" },
      { status: 500 }
    );
  }
}