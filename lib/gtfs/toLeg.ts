import type { Leg } from "../graph/types";
import type { GtfsStopTime, LoadedGtfsFeed } from "./types";
import { parseGtfsTime } from "./time";

/**
 * Builds one Leg from a single stop_times pair on one trip — mirrors
 * lib/providers/ixigo/mapResponse.ts's mapIxigoServiceToLeg (same Leg
 * shape, same depAbsMin/arrAbsMin-since-service-day-midnight convention),
 * just fed from a parsed GTFS trip instead of an ixigo API response.
 *
 * Returns null for anything unparseable — one malformed stop_times row
 * shouldn't drop every other trip on the route.
 */
export function gtfsStopTimesToLeg(
  feed: LoadedGtfsFeed,
  tripId: string,
  fromStopTime: GtfsStopTime,
  toStopTime: GtfsStopTime,
  from: string,
  to: string,
): Leg | null {
  const depAbsMin = parseGtfsTime(fromStopTime.departure_time);
  const arrAbsMin = parseGtfsTime(toStopTime.arrival_time);
  if (depAbsMin === null || arrAbsMin === null || arrAbsMin <= depAbsMin) return null;

  const trip = feed.trips.get(tripId);
  const route = trip ? feed.routes.get(trip.route_id) : undefined;
  const routeName = route?.route_short_name || route?.route_long_name || trip?.route_id || "Bus";
  const durationMin = arrAbsMin - depAbsMin;

  return {
    mode: "bus",
    source: "live",
    trainNo: `gtfs-${feed.config.id}-${tripId}`,
    trainName: `${routeName} · ${feed.config.name}`,
    from,
    to,
    departure: minutesToHHDotMM(depAbsMin),
    arrival: minutesToHHDotMM(arrAbsMin),
    travelTime: minutesToHHDotMM(durationMin),
    runningDays: "1111111", // this specific service_id's active-day pattern was already checked in lib/gtfs/activeServices.ts before this trip was even considered — every trip reaching here already runs on the search date
    depAbsMin,
    arrAbsMin,
    bookingUrl: null, // open-data schedule feeds, no booking flow to link to
    precomputed: {
      // GTFS static carries no real-time seat data — UNKNOWN is the honest
      // category here (see lib/erail/avl.ts's AvlStatusCategory), not
      // AVAILABLE, since availability simply wasn't looked up, not confirmed.
      availability: { key: `gtfs-${feed.config.id}-${tripId}`, category: "UNKNOWN", count: null, rawStatus: "Schedule only — no live seat data", rawNums: "" },
      fare: null, // fares.txt is rare in published Indian STU feeds and not read here; nothing to show
    },
  };
}

/** Minutes-since-midnight -> 'HH.MM', matching lib/providers/types.ts's minutesToHHMM convention used by every other non-train leg. */
function minutesToHHDotMM(min: number): string {
  const m = Math.round(((min % 1440) + 1440) % 1440);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}.${String(mm).padStart(2, "0")}`;
}
