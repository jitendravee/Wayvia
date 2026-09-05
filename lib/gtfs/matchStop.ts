import type { GtfsStop, LoadedGtfsFeed } from "./types";

/**
 * Picks the single best stop within `feed` for `queryText` (a Place's
 * name, e.g. "Bengaluru", "Electronic City", "Whitefield"). Two cases:
 *
 *  1. `queryText` names the feed's OWN city (matches config.cityAliases) —
 *     the query is too broad to mean any one stop (a city has thousands),
 *     so fall back to config.hubStopHints and pick whichever configured
 *     major-terminus name actually exists in this feed's stops.
 *  2. Otherwise, plain fuzzy name matching directly against every stop in
 *     the feed — same scoring shape as lib/stations.ts's searchStations
 *     (exact > starts-with > contains), which is exactly right for a
 *     locality Place ("Electronic City") that likely already matches a
 *     GTFS stop_name close to verbatim.
 *
 * Returns null if nothing reasonable matches — the caller (lib/gtfs/search.ts)
 * treats that as "this feed doesn't cover this place," which is the
 * common, expected case (most Places aren't inside any one configured
 * feed's city).
 */
export function matchStopForPlace(feed: LoadedGtfsFeed, queryText: string): GtfsStop | null {
  const q = queryText.trim().toLowerCase();
  if (!q) return null;

  // A stop with zero stop_times entries can never produce a leg — several
  // real feeds carry these (e.g. a metro-interchange marker sharing a name
  // with a nearby bus stop but no bus service of its own). Prefer a
  // same-scoring stop that actually has service; only fall back to a
  // service-less one if literally nothing else matched at all.
  const hasService = (stop: GtfsStop) => (feed.stopTimesByStop.get(stop.stop_id)?.length ?? 0) > 0;

  const isFeedCity = feed.config.cityAliases.some((alias) => alias.toLowerCase() === q);
  if (isFeedCity && feed.config.hubStopHints?.length) {
    let fallback: GtfsStop | null = null;
    for (const hint of feed.config.hubStopHints) {
      const hintLower = hint.toLowerCase();
      for (const stop of feed.stops.values()) {
        if (!stop.stop_name.toLowerCase().includes(hintLower)) continue;
        if (hasService(stop)) return stop; // first serviceable hit across ALL hints, in hint-priority order
        fallback ??= stop;
      }
    }
    if (fallback) return fallback;
    // Named this feed's city but none of the hub hints matched an actual
    // stop in the feed (hints are best-effort, kept in sync by hand) —
    // still better to hand back *some* stop in the city than none, so a
    // GTFS-covered city isn't silently unusable just because the curated
    // hub-name list is stale. Picking any stop is safe here because every
    // stop in the feed is, by definition, within this feed's one city.
    let anyStop: GtfsStop | null = null;
    for (const stop of feed.stops.values()) {
      anyStop ??= stop;
      if (hasService(stop)) return stop;
    }
    return anyStop;
  }

  let best: { stop: GtfsStop; score: number } | null = null;
  let bestServiceable: { stop: GtfsStop; score: number } | null = null;
  for (const stop of feed.stops.values()) {
    const name = stop.stop_name.toLowerCase();
    let score = -1;
    if (name === q) score = 100;
    else if (name.startsWith(q)) score = 80;
    else if (q.startsWith(name) && name.length >= 3) score = 70;
    else if (name.includes(q)) score = 40;
    if (score <= 0) continue;
    if (score > (best?.score ?? -1)) best = { stop, score };
    if (hasService(stop) && score > (bestServiceable?.score ?? -1)) bestServiceable = { stop, score };
  }
  // A service-less stop can never produce a leg, no matter how well its
  // name matches — so any serviceable match, even a lower-scoring one,
  // beats the best-scoring service-less one. Only fall back to a
  // service-less stop if literally nothing serviceable matched at all.
  if (bestServiceable) return bestServiceable.stop;
  return best ? best.stop : null;
}
