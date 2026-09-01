import { NextRequest, NextResponse } from "next/server";
import type { Place } from "@/lib/places/model";
import { searchStations } from "@/lib/stations";
import { cityNameFromStationName } from "@/lib/providers/ixigo/cityResolve";
import { normalizePlaceName, placeIdFromName } from "@/lib/places/resolver";
import { fetchGeonamesPlaces } from "@/lib/places/geonames";

/**
 * GET /api/places?q=Pune&limit=8
 *
 * Returns canonical Place objects for city/place discovery — this is what
 * the frontend's search box calls for autocomplete.
 *
 * TWO SOURCES, merged:
 *
 *  1. GeoNames' own search webservice (lib/places/geonames.ts), scoped to
 *     India populated places (cities, towns AND villages). This used to be
 *     countries.dev instead — but countries.dev only mirrors a subset of
 *     GeoNames' own database (something closer to its "cities above a
 *     population floor" tier), which is exactly why real, well-connected
 *     small towns like Rohtak, Jind, Sojat Road, or Marwar could be
 *     missing from it. Querying GeoNames directly returns the full
 *     breadth of the underlying dataset instead of a curated slice of it.
 *
 *  2. The erail-backed live station directory (lib/stations.ts) — this
 *     covers essentially every Indian Railways station. Kept as a second
 *     source (not just relying on GeoNames) because it's guaranteed
 *     searchable/bookable — every entry here already has a real station
 *     code the journey graph can search against, whereas a GeoNames place
 *     that isn't served by rail still needs bus/onward routing to work.
 *
 * A place could previously fail to appear as a suggestion even though the
 * journey graph (lib/graph/discover.ts, discoverMultimodal.ts) was already
 * fully capable of routing through it once given its station code — the
 * gap was purely "the box never offered it", not "the graph can't reach
 * it". Both changes here are scoped to this suggestion box; the
 * graph/search logic didn't need to change.
 *
 * GeoNames wins on de-dupe when both sources agree on the same city (it
 * has the richer lat/lon + place-type data); the station-backed source
 * only fills genuine gaps — e.g. junction towns whose name doesn't quite
 * match how GeoNames spells the place.
 */
export async function GET(req: NextRequest) {
  const qRaw = req.nextUrl.searchParams.get("q") ?? "";
  const q = qRaw.trim();
  const limit = Math.min(20, Number(req.nextUrl.searchParams.get("limit") ?? "8") || 8);

  if (!q) {
    return NextResponse.json({ query: qRaw, results: [] });
  }

  // Run both sources in parallel and independently-error-handled — a slow or
  // rate-limited GeoNames call should never take down station-backed
  // suggestions, and a station-directory hiccup should never take down
  // GeoNames results either.
  const [geonamesPlaces, stationPlaces] = await Promise.all([
    fetchGeonamesPlaces(q, limit),
    fetchStationSuggestions(q, limit),
  ]);

  const byName = new Map<string, Place>();
  for (const p of geonamesPlaces) byName.set(p.normalizedName, p);
  for (const p of stationPlaces) {
    if (!byName.has(p.normalizedName)) byName.set(p.normalizedName, p);
  }

  // Surface exact/prefix matches on the query first — a merged, de-duped
  // map loses the original per-source ranking, so re-rank once here.
  const qLower = q.toLowerCase();
  const results = Array.from(byName.values())
    .sort((a, b) => rankFor(a, qLower) - rankFor(b, qLower))
    .slice(0, limit);

  return NextResponse.json({ query: qRaw, results });
}

function rankFor(p: Place, qLower: string): number {
  const n = p.normalizedName;
  if (n === qLower) return 0;
  if (n.startsWith(qLower)) return 1;
  if (n.includes(qLower)) return 2;
  return 3;
}

/**
 * Turns erail station-directory matches into suggestible Places, collapsing
 * every station that serves the same city into a single suggestion (e.g.
 * "Rohtak Jn" -> one "Rohtak" entry, not one per platform/branch station).
 */
async function fetchStationSuggestions(q: string, limit: number): Promise<Place[]> {
  try {
    // Ask for more raw stations than `limit`, since several can collapse
    // into one city and we still want `limit` worth of distinct places.
    const stations = await searchStations(q, Math.min(40, limit * 5));

    const byCity = new Map<string, Place>();
    for (const s of stations) {
      const cityName = cityNameFromStationName(s.name);
      const normalizedName = normalizePlaceName(cityName);

      const existing = byCity.get(normalizedName);
      if (existing) {
        if (existing.railway && !existing.railway.stations.some((st) => st.code === s.code)) {
          existing.railway.stations.push({ code: s.code, name: s.name });
        }
        continue;
      }

      byCity.set(normalizedName, {
        id: placeIdFromName(cityName),
        name: cityName,
        normalizedName,
        latitude: 0,
        longitude: 0,
        hasCoords: false,
        state: s.state,
        country: "India",
        type: "town",
        railway: { stations: [{ code: s.code, name: s.name }] },
        bus: { locations: [] },
        flight: { airports: [] },
        isHub: false,
      });
    }

    return Array.from(byCity.values());
  } catch (error) {
    console.error("Error fetching station-backed place suggestions:", error);
    return [];
  }
}
