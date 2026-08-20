import { getRoute } from "../erail/client";
import type { RouteStop } from "../erail/prettify";
import { registerDiscoveredStations } from "../erail/stationDirectory";
import type { ScoredHub } from "./hubs";

/**
 * This is the implementation of the note that used to sit at the bottom of
 * hubs.ts:
 *
 *   "FUTURE IMPROVEMENT: instead of a static curated list, derive hub
 *   candidates dynamically by fetching getRoute() for a few near-miss
 *   trains and reading their real intermediate stops."
 *
 * Instead of guessing hubs from geography, this asks erail.in directly:
 * "here are a few real trains that actually leave `from` — where do they
 * really stop?" Every stop between `from` and the end of that train's route
 * is a station a real train physically passes through, which is strictly
 * better routing topology than a haversine-distance guess.
 *
 * This is deliberately gated behind "near-miss" seed trains (trains found
 * during a normal search that run FROM the origin but didn't happen to
 * connect to the destination) rather than run on every search — each
 * candidate costs a getRoute() round trip (itself two erail.in requests:
 * getTrains for the train_id, then the TRAINROUTE endpoint), so this only
 * fires when the cheaper static+live hub pass came up thin. See
 * lib/graph/discover.ts for where it's wired in.
 */

export interface RouteDerivedHub extends ScoredHub {
  source: "route-topology";
  /** The real train whose route produced this candidate stop. */
  viaTrainNo: string;
}

export interface DynamicHubOptions {
  /** Cap on how many seed trains actually get a getRoute() call — keeps this from becoming an unbounded fan-out. */
  maxSeedTrains?: number;
  /** Cap on how many intermediate stops (per seed train) become hub candidates. */
  maxStopsPerTrain?: number;
}

/**
 * Given a handful of real train numbers known to depart `from`, fetches
 * each one's actual route and returns every real intermediate stop as a
 * scored hub candidate for a follow-up betweenStations() pass toward `to`.
 * Also registers every stop it sees with the live station directory, so
 * autocomplete and future searches benefit even if this particular journey
 * doesn't pan out.
 */
export async function discoverHubsFromRoutes(
  from: string,
  to: string,
  seedTrainNos: string[],
  opts: DynamicHubOptions = {}
): Promise<RouteDerivedHub[]> {
  const maxSeedTrains = opts.maxSeedTrains ?? 5;
  const maxStopsPerTrain = opts.maxStopsPerTrain ?? 8;
  const fromCode = from.toUpperCase();
  const toCode = to.toUpperCase();

  const seeds = Array.from(new Set(seedTrainNos)).slice(0, maxSeedTrains);
  if (seeds.length === 0) return [];

  const routeResults = await Promise.all(
    seeds.map(async (trainNo) => {
      try {
        const result = await getRoute(trainNo);
        if (!result || !result.success) return null;
        return { trainNo, stops: result.data as RouteStop[] };
      } catch {
        return null;
      }
    })
  );

  const byCode = new Map<string, RouteDerivedHub>();

  for (const entry of routeResults) {
    if (!entry) continue;
    const { trainNo, stops } = entry;
    if (!Array.isArray(stops) || stops.length === 0) continue;

    // Feed the live directory regardless of whether this train ends up useful for this search.
    registerDiscoveredStations(stops.map((s) => ({ code: s.source_stn_code, name: s.source_stn_name })));

    const fromIdx = stops.findIndex((s) => s.source_stn_code?.toUpperCase() === fromCode);
    if (fromIdx === -1) continue; // this train's route doesn't actually touch our origin under this code — skip

    const toIdx = stops.findIndex((s) => s.source_stn_code?.toUpperCase() === toCode);
    // If the train's own route already reaches `to`, that's really a direct-train case, not a hub —
    // let the normal direct search surface it; nothing extra to learn here as a *hub* candidate.
    const stopsAfterFrom = stops.slice(fromIdx + 1, toIdx === -1 ? undefined : toIdx);

    let taken = 0;
    for (let i = 0; i < stopsAfterFrom.length && taken < maxStopsPerTrain; i++) {
      const stop = stopsAfterFrom[i];
      const code = stop.source_stn_code?.toUpperCase();
      if (!code || code === fromCode || code === toCode) continue;

      // Heuristic: a stop roughly in the first half of the remaining route is more likely to leave
      // enough onward network reach to still connect toward `to`; taper relevance toward the tail end.
      const positionRatio = stopsAfterFrom.length > 1 ? i / (stopsAfterFrom.length - 1) : 0;
      const relevance = Math.max(0.25, 0.85 - positionRatio * 0.5);

      const existing = byCode.get(code);
      if (!existing || relevance > existing.relevance) {
        byCode.set(code, {
          code,
          name: stop.source_stn_name || code,
          lat: 0,
          lon: 0,
          relevance,
          detourRatio: null,
          source: "route-topology",
          viaTrainNo: trainNo,
        });
      }
      taken++;
    }
  }

  return Array.from(byCode.values()).sort((a, b) => b.relevance - a.relevance);
}