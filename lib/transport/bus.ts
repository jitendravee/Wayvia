import type { Place } from "../places/model";
import type { Leg } from "../graph/types";
import type { TransportProvider } from "./types";
import { BUS_PROVIDERS } from "../providers/busProviders";

/**
 * The text each bus provider should search on for this place — ixigo's own
 * city resolution (lib/providers/ixigo/cityResolve.ts) and the GTFS stop
 * matcher (lib/gtfs/matchStop.ts) both take arbitrary place-name text
 * directly. A resolved bus location's name if we have one; otherwise the
 * place's own display name.
 */
function busQueryText(place: Place): string {
  return place.bus?.locations[0]?.name ?? place.name;
}

/**
 * Two legs are "the same real bus" if they cover the same stop pair and
 * depart within this many minutes of each other. Published schedules and
 * live listings for the same physical service rarely agree to the exact
 * minute (rounding, revision lag between sources), so an exact depAbsMin
 * match would under-detect duplicates and show the same coach twice.
 */
const DUPLICATE_DEPARTURE_TOLERANCE_MIN = 10;

/**
 * Merges legs from however many bus sources ran (see BUS_PROVIDERS in
 * lib/providers/busProviders.ts — currently 2, but this doesn't assume a
 * fixed count), deduplicating so the same physical bus doesn't show up
 * twice under two different identities. Sources are walked in priority
 * order (lowest number first); the first source to report a given
 * departure wins, and every lower-priority source's matching leg for that
 * departure is dropped. In practice this means ixigo's live
 * availability/fare/booking entry always wins over a schedule-only GTFS
 * entry for the same bus, while GTFS-only coverage (a route no other
 * source lists) still comes through untouched.
 */
function mergeMultiSourceBusLegs(sources: { priority: number; legs: Leg[] }[]): Leg[] {
  const ordered = [...sources].sort((a, b) => a.priority - b.priority);
  const accepted: Leg[] = [];
  for (const { legs } of ordered) {
    for (const leg of legs) {
      const isDuplicate = accepted.some((a) => Math.abs(a.depAbsMin - leg.depAbsMin) <= DUPLICATE_DEPARTURE_TOLERANCE_MIN);
      if (!isDuplicate) accepted.push(leg);
    }
  }
  return accepted.sort((a, b) => a.depAbsMin - b.depAbsMin);
}

/**
 * `TransportProvider.searchConnections` for bus — a multi-layer search
 * over every entry in BUS_PROVIDERS (lib/providers/busProviders.ts), run
 * in parallel via Promise.allSettled so one source's failure never blocks
 * the others, then combined by mergeMultiSourceBusLegs above.
 *
 * Currently two sources are configured — GTFS static feeds (lib/gtfs/,
 * free/open, schedule-only; see lib/gtfs/feeds.ts for exactly what's
 * covered: city-scope Karnataka/Tamil Nadu feeds today, with state- and
 * interstate-scope slots ready and documented for the moment a real public
 * feed exists for either) and ixigo (lib/providers/ixigoBus.ts, untouched,
 * live availability/fare/booking, today's only real intercity/interstate
 * source) — but neither this function nor mergeMultiSourceBusLegs assumes
 * exactly two; adding a third provider to BUS_PROVIDERS is the only change
 * needed to fold it into the same search/merge/dedupe flow.
 */
export const busProvider: TransportProvider = {
  mode: "bus",
  async searchConnections(from, to, date) {
    const fromText = busQueryText(from);
    const toText = busQueryText(to);

    const settled = await Promise.allSettled(BUS_PROVIDERS.map((p) => p.provider.search(fromText, toText, date)));

    const sources = BUS_PROVIDERS.map((p, i) => {
      const result = settled[i];
      if (result.status === "rejected") {
        console.error(`busProvider: ${p.label} layer (${fromText} -> ${toText}) failed:`, result.reason);
        return { priority: p.priority, legs: [] as Leg[] };
      }
      return { priority: p.priority, legs: result.value };
    });

    return mergeMultiSourceBusLegs(sources);
  },
};
