import { buildAvlKey, fetchAvailability, toAvlDate, AvlAvailability, AvlFare } from "./erail/avl";
import type { JourneyCandidate, Leg, PartialCoverage } from "./graph/types";

export interface AnnotatedLeg extends Leg {
  avlKey: string;
  availability: AvlAvailability | null; // null = no data returned for this key
  fare: number | null;
}

export interface AnnotatedJourney {
  legs: AnnotatedLeg[];
  hub?: string;
  /** True only if every leg's status is AVAILABLE. */
  fullyConfirmed: boolean;
  /** True if at least one leg is NOT_AVAILABLE or REGRET (worth deprioritizing, not necessarily excluding). */
  hasBlockedLeg: boolean;
  totalFare: number | null; // null if any leg is missing fare data
  totalDurationMin: number;
  connections: number;
}

/**
 * Annotates every candidate's legs with real availability + fare pulled
 * from s.erail.in/getvalue, in a single batched request across all
 * candidates (not one request per candidate) — same funnel-then-check
 * principle as the original mock-data version: narrow down structurally
 * first, then hit the live endpoint once on the survivors.
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
      allKeys.add(buildAvlKey(leg.trainNo, leg.from, leg.to, travelClass, quota, avlDate));
    }
  }

  const { availability, fares } = await fetchAvailability([...allKeys]);

  return candidates.map((c) => {
    const legs: AnnotatedLeg[] = c.legs.map((leg) => {
      const key = buildAvlKey(leg.trainNo, leg.from, leg.to, travelClass, quota, avlDate);
      const avl = availability.get(key) ?? null;
      const fareEntry = fares.get(key) ?? null;
      return { ...leg, avlKey: key, availability: avl, fare: fareEntry ? fareEntry.estimatedFare : null };
    });

    const fullyConfirmed = legs.every((l) => l.availability?.category === "AVAILABLE");
    const hasBlockedLeg = legs.some((l) => l.availability?.category === "NOT_AVAILABLE" || l.availability?.category === "REGRET");
    const totalFare = legs.every((l) => l.fare !== null) ? legs.reduce((sum, l) => sum + (l.fare ?? 0), 0) : null;
    const totalDurationMin = legs[legs.length - 1].arrAbsMin - legs[0].depAbsMin;

    return {
      legs,
      hub: c.hub,
      fullyConfirmed,
      hasBlockedLeg,
      totalFare,
      totalDurationMin,
      connections: legs.length - 1,
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