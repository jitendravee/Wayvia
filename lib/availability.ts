import { buildAvlKey, fetchAvailability, toAvlDate, AvlAvailability, AvlFare } from "./erail/avl";
import type { JourneyCandidate, Leg, Mode, PartialCoverage } from "./graph/types";

export interface AnnotatedLeg extends Leg {
  /** null for non-train legs — there's no erail key involved, see `precomputed` on Leg. */
  avlKey: string | null;
  availability: AvlAvailability | null; // null = no data returned for this key
  fare: number | null;
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
}

/**
 * Annotates every candidate's legs with availability + fare. Train legs get
 * this from a single batched request to s.erail.in/getvalue (same
 * funnel-then-check principle as before: narrow down structurally first,
 * then hit the live endpoint once on the survivors). Non-train legs (bus,
 * flight — currently mock, eventually real providers) skip erail entirely
 * and use whatever they already computed on `leg.precomputed`, since a
 * train-specific seat-status endpoint has nothing to say about a bus.
 */
export async function annotateWithAvailability(
  candidates: JourneyCandidate[],
  date: string, // 'YYYY-MM-DD'
  travelClass: string,
  quota: string = "GN"
): Promise<AnnotatedJourney[]> {
  const avlDate = toAvlDate(date);

  const allKeys = new Set<string>();
  for (const c of candidates) {
    for (const leg of c.legs) {
      if (leg.mode === "train") {
        allKeys.add(buildAvlKey(leg.trainNo, leg.from, leg.to, travelClass, quota, avlDate));
      }
    }
  }

  const { availability, fares } = await fetchAvailability([...allKeys]);

  return candidates.map((c) => {
    const legs: AnnotatedLeg[] = c.legs.map((leg) => {
      if (leg.mode !== "train") {
        return {
          ...leg,
          avlKey: null,
          availability: leg.precomputed?.availability ?? null,
          fare: leg.precomputed?.fare ?? null,
        };
      }
      const key = buildAvlKey(leg.trainNo, leg.from, leg.to, travelClass, quota, avlDate);
      const avl = availability.get(key) ?? null;
      const fareEntry = fares.get(key) ?? null;
      return { ...leg, avlKey: key, availability: avl, fare: fareEntry ? fareEntry.estimatedFare : null };
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
    };
  });
}

export interface AnnotatedPartialCoverage extends PartialCoverage {
  leg: AnnotatedLeg;
}

/**
 * Same live-data pass as annotateWithAvailability, but for partial-coverage
 * results (single real leg each) — so "we got you to X" also shows real
 * seat status and fare, not just a schedule.
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
  const { availability, fares } = await fetchAvailability(keys);

  return partial.map((p, i) => {
    const key = keys[i];
    const avl = availability.get(key) ?? null;
    const fareEntry = fares.get(key) ?? null;
    return {
      ...p,
      leg: { ...p.leg, avlKey: key, availability: avl, fare: fareEntry ? fareEntry.estimatedFare : null },
    };
  });
}