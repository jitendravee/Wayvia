import { buildAvlKey, fetchAvailability, toAvlDate, AvlAvailability, AvlFare } from "./erail/avl";
import { fetchTrainFares, getFareForClassQuota } from "./erail/fare";
import type { JourneyCandidate, Leg, Mode, PartialCoverage } from "./graph/types";
import { getStationCoord, StationCoord } from "./geo";

export interface AnnotatedLeg extends Leg {
  /** null for non-train legs — there's no erail key involved, see `precomputed` on Leg. */
  avlKey: string | null;
  availability: AvlAvailability | null; // null = no data returned for this key
  fare: number | null;
  /** Known map coordinates for the boarding/alighting stations, when this station is in the curated directory (lib/geo.ts). Null means the frontend needs to fall back to live geocoding for this one. */
  fromGeo: StationCoord | null;
  toGeo: StationCoord | null;
}

/** One stop along a journey, ready to plot on a map — origin, every hub/junction change, and the final destination, each carrying whatever mode got the traveller *to* that stop. */
export interface RouteStop {
  code: string;
  name: string;
  /** Null when this station code isn't in the curated coordinate directory (lib/geo.ts) — frontend should fall back to live geocoding just for this stop. */
  lat: number | null;
  lon: number | null;
  kind: "origin" | "junction" | "destination";
  time: string;
  /** Mode of the leg that arrives at this stop. Absent for the origin (nothing arrives there). */
  arrivingMode?: Mode;
  /** Service id (train no / bus id / flight no) of the leg that arrives at this stop. Absent for the origin. */
  arrivingService?: string;
}

export interface AnnotatedJourney {
  legs: AnnotatedLeg[];
  hub?: string;
  hub2?: string;
  hub3?: string;
  hubSource?: "static" | "live" | "route-topology";
  /** True only if every leg's status is AVAILABLE. */
  fullyConfirmed: boolean;
  /** True if at least one leg is NOT_AVAILABLE or REGRET (worth deprioritizing, not necessarily excluding). */
  hasBlockedLeg: boolean;
  totalFare: number | null; // null if any leg is missing fare data
  totalDurationMin: number;
  connections: number;
  /** Waiting time between consecutive legs, in minutes — length is always legs.length - 1. */
  gapsMin: number[];
  /** Distinct modes used across this journey's legs, in leg order (deduped) — e.g. ["train"], or ["train","bus"] for a mixed itinerary. */
  modesUsed: Mode[];
  /** Ordered stop-by-stop map data for this exact journey (origin → every hub → destination), coordinates included wherever known. Ready to feed straight into a map component. */
  routeStops: RouteStop[];
}

/** Builds the ordered, map-ready stop list for one journey's legs — origin, every hub, destination. */
export function buildRouteStops(legs: Leg[]): RouteStop[] {
  const stops: RouteStop[] = [];
  legs.forEach((leg, i) => {
    if (i === 0) {
      const geo = getStationCoord(leg.from);
      stops.push({
        code: leg.from,
        name: geo?.name ?? leg.from,
        lat: geo?.lat ?? null,
        lon: geo?.lon ?? null,
        kind: "origin",
        time: leg.departure,
      });
    }
    const isLast = i === legs.length - 1;
    const geo = getStationCoord(leg.to);
    stops.push({
      code: leg.to,
      name: geo?.name ?? leg.to,
      lat: geo?.lat ?? null,
      lon: geo?.lon ?? null,
      kind: isLast ? "destination" : "junction",
      time: leg.arrival,
      arrivingMode: leg.mode,
      arrivingService: leg.trainNo,
    });
  });
  return stops;
}

/**
 * Annotates every candidate's legs with availability + fare.
 *
 * Availability always comes from a single batched s.erail.in/getvalue call
 * (same funnel-then-check principle as before: narrow down structurally
 * first, then hit the live endpoint once on the survivors) — that endpoint
 * remains the only source of real-time seat status.
 *
 * Fare now comes primarily from erail.in/train-fare/{trainNo} — a real
 * fare-lookup page with one row per quota (General/Tatkal) and one column
 * per class, fetched once per unique (trainNo, from, to) leg and cached
 * (see lib/erail/fare.ts). This runs strictly AFTER availability, and only
 * for legs whose availability came back AVAILABLE — a leg with no seats is
 * getting excluded from `fullyConfirmed` results anyway (see
 * runJourneySearch's `availableOnly` filter), so its fare is never shown
 * and isn't worth an extra request for. In practice this cuts the fare
 * fetch down to a small handful of legs even when there are thousands of
 * candidates, since most legs on most candidates aren't AVAILABLE.
 *
 * The older approach of pulling a fare out of getvalue's own "_f" response
 * is kept ONLY as a fallback for whatever AVAILABLE leg the fare page
 * didn't return data for (network hiccup, unusual class), since that field
 * is a positionally-guessed value from an undocumented blob rather than a
 * real fare table.
 *
 * Non-train legs (bus, flight — currently mock, eventually real providers)
 * skip both erail sources entirely and use whatever they already computed
 * on `leg.precomputed`.
 */
export async function annotateWithAvailability(
  candidates: JourneyCandidate[],
  date: string, // 'YYYY-MM-DD'
  travelClass: string,
  quota: string = "GN"
): Promise<AnnotatedJourney[]> {
  const avlDate = toAvlDate(date);

  const allKeys = new Set<string>();
  // avlKey -> which (trainNo, from, to) it belongs to, so that once
  // availability is back we know exactly which legs are worth a fare
  // fetch — without this we'd have no way to connect an AVL key back to
  // the leg it came from.
  const keyToLeg = new Map<string, { trainNo: string; from: string; to: string }>();
  for (const c of candidates) {
    for (const leg of c.legs) {
      if (leg.mode === "train") {
        const key = buildAvlKey(leg.trainNo, leg.from, leg.to, travelClass, quota, avlDate);
        allKeys.add(key);
        if (!keyToLeg.has(key)) keyToLeg.set(key, { trainNo: leg.trainNo, from: leg.from, to: leg.to });
      }
    }
  }

  // Availability has to resolve first — fare fetching depends on its
  // result now, so this can no longer run in parallel with it.
  const { availability, fares } = await fetchAvailability([...allKeys]);

  const availableLegs: { trainNo: string; from: string; to: string }[] = [];
  for (const [key, leg] of keyToLeg) {
    if (availability.get(key)?.category === "AVAILABLE") availableLegs.push(leg);
  }

  const fareTables = await fetchTrainFares(availableLegs);

  return candidates.map((c) => {
    const legs: AnnotatedLeg[] = c.legs.map((leg) => {
      const fromGeo = getStationCoord(leg.from);
      const toGeo = getStationCoord(leg.to);
      if (leg.mode !== "train") {
        return {
          ...leg,
          avlKey: null,
          availability: leg.precomputed?.availability ?? null,
          fare: leg.precomputed?.fare ?? null,
          fromGeo,
          toGeo,
        };
      }
      const key = buildAvlKey(leg.trainNo, leg.from, leg.to, travelClass, quota, avlDate);
      const avl = availability.get(key) ?? null;
      const fareEntry = fares.get(key) ?? null;

      const fareTable = fareTables.get(`${leg.trainNo}_${leg.from}_${leg.to}`);
      const tableFare = fareTable ? getFareForClassQuota(fareTable, travelClass, quota) : null;
      const fare = tableFare ?? (fareEntry ? fareEntry.estimatedFare : null);

      return { ...leg, avlKey: key, availability: avl, fare, fromGeo, toGeo };
    });

    const fullyConfirmed = legs.every((l) => l.availability?.category === "AVAILABLE");
    const hasBlockedLeg = legs.some((l) => l.availability?.category === "NOT_AVAILABLE" || l.availability?.category === "REGRET");
    const totalFare = legs.every((l) => l.fare !== null) ? legs.reduce((sum, l) => sum + (l.fare ?? 0), 0) : null;
    const totalDurationMin = legs[legs.length - 1].arrAbsMin - legs[0].depAbsMin;
    const gapsMin = legs.slice(1).map((l, i) => l.depAbsMin - legs[i].arrAbsMin);
    const modesUsed = Array.from(new Set(legs.map((l) => l.mode)));

    return {
      legs,
      hub: c.hub,
      hub2: c.hub2,
      hub3: c.hub3,
      hubSource: c.hubSource,
      fullyConfirmed,
      hasBlockedLeg,
      totalFare,
      totalDurationMin,
      connections: legs.length - 1,
      gapsMin,
      modesUsed,
      routeStops: buildRouteStops(c.legs),
    };
  });
}

export interface AnnotatedPartialCoverage extends PartialCoverage {
  leg: AnnotatedLeg;
}

/**
 * Same live-data pass as annotateWithAvailability, but for partial-coverage
 * results (single real leg each) — so "we got you to X" also shows real
 * seat status and fare, not just a schedule. Fare sourcing follows the
 * same erail.in/train-fare-first, getvalue-"_f"-fallback order.
 */
export async function annotatePartialCoverage(
  partial: PartialCoverage[],
  date: string,
  travelClass: string,
  quota: string = "GN"
): Promise<AnnotatedPartialCoverage[]> {
  if (partial.length === 0) return [];
  const avlDate = toAvlDate(date);
  const keys = partial.map((p) => buildAvlKey(p.leg.trainNo, p.leg.from, p.leg.to, travelClass, quota, avlDate));

  const fareLegs = partial.map((p) => ({ trainNo: p.leg.trainNo, from: p.leg.from, to: p.leg.to }));

  const [{ availability, fares }, fareTables] = await Promise.all([
    fetchAvailability(keys),
    fetchTrainFares(fareLegs),
  ]);

  return partial.map((p, i) => {
    const key = keys[i];
    const avl = availability.get(key) ?? null;
    const fareEntry = fares.get(key) ?? null;

    const fareTable = fareTables.get(`${p.leg.trainNo}_${p.leg.from}_${p.leg.to}`);
    const tableFare = fareTable ? getFareForClassQuota(fareTable, travelClass, quota) : null;
    const fare = tableFare ?? (fareEntry ? fareEntry.estimatedFare : null);

    return {
      ...p,
      leg: {
        ...p.leg,
        avlKey: key,
        availability: avl,
        fare,
        fromGeo: getStationCoord(p.leg.from),
        toGeo: getStationCoord(p.leg.to),
      },
    };
  });
}