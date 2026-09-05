import type { Leg } from "../graph/types";
import type { LoadedGtfsFeed } from "./types";
import { GTFS_FEEDS } from "./feeds";
import { loadGtfsFeed } from "./loadFeed";
import { matchStopForPlace } from "./matchStop";
import { activeServiceIds } from "./activeServices";
import { gtfsStopTimesToLeg } from "./toLeg";

/** Every direct trip from `fromStop` to `toStop` (in that order) on `date`, within one already-loaded feed. */
function connectionsWithinFeed(feed: LoadedGtfsFeed, fromStopId: string, toStopId: string, date: string, from: string, to: string): Leg[] {
  if (fromStopId === toStopId) return [];

  const fromTimes = feed.stopTimesByStop.get(fromStopId);
  const toTimes = feed.stopTimesByStop.get(toStopId);
  if (!fromTimes?.length || !toTimes?.length) return [];

  const active = activeServiceIds(feed, date);
  if (active.size === 0) return [];

  // Index the smaller side by trip_id for O(1) lookup while walking the larger side.
  const [smaller, larger, smallerIsFrom] = fromTimes.length <= toTimes.length ? [fromTimes, toTimes, true] : [toTimes, fromTimes, false];
  const byTrip = new Map<string, (typeof smaller)[number]>();
  for (const st of smaller) byTrip.set(st.trip_id, st);

  const legs: Leg[] = [];
  for (const otherSt of larger) {
    const matchSt = byTrip.get(otherSt.trip_id);
    if (!matchSt) continue;

    const fromSt = smallerIsFrom ? matchSt : otherSt;
    const toSt = smallerIsFrom ? otherSt : matchSt;
    if (fromSt.stop_sequence >= toSt.stop_sequence) continue; // wrong direction on this trip

    const trip = feed.trips.get(fromSt.trip_id);
    if (!trip || !active.has(trip.service_id)) continue; // trip doesn't run on this date

    const leg = gtfsStopTimesToLeg(feed, fromSt.trip_id, fromSt, toSt, from, to);
    if (leg) legs.push(leg);
  }
  return legs;
}

/**
 * Searches every configured GTFS feed (lib/gtfs/feeds.ts) in parallel for
 * direct bus trips from `fromText` to `toText` on `date` — the GTFS layer
 * of the multi-layer bus search described in lib/transport/bus.ts. Each
 * feed independently: loads (cached — see loadGtfsFeed), tries to match
 * both place names to one of its own stops, and if both match, returns
 * every trip that actually runs that route on that date.
 *
 * Fails soft at every level, same contract as the ixigo bus provider: a
 * feed that's down, a place neither endpoint matches, or a route with no
 * service on this date all just contribute [] from that feed, never an
 * exception that would take down the rest of the multimodal search.
 */
export async function searchGtfsBusConnections(fromText: string, toText: string, date: string): Promise<Leg[]> {
  const results = await Promise.all(
    GTFS_FEEDS.map(async (config) => {
      try {
        const feed = await loadGtfsFeed(config);
        if (!feed) return [];

        const fromStop = matchStopForPlace(feed, fromText);
        const toStop = matchStopForPlace(feed, toText);
        if (!fromStop || !toStop) return []; // this feed doesn't cover one (or both) ends of this pair

        return connectionsWithinFeed(feed, fromStop.stop_id, toStop.stop_id, date, fromText, toText);
      } catch (err) {
        console.error(`searchGtfsBusConnections: feed ${config.id} (${fromText} -> ${toText}) failed:`, err);
        return [];
      }
    }),
  );
  return results.flat();
}
