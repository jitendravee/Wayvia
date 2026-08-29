import { DEFAULT_HUBS } from "../graph/hubs";
import { getOrCreateHubPlace, allCachedPlaces } from "./repository";
import type { Place } from "./model";

/**
 * The sparse Place graph. Deliberately NOT a full city×city adjacency
 * table (that would be enormous and mostly useless) — instead, for any
 * given origin/destination pair, this scores a bounded candidate pool
 * (the curated hub seed list ∪ every Place this process has already
 * resolved, e.g. from earlier searches) by how plausible a transfer point
 * each one is, and returns the top few. Transport providers then decide,
 * per candidate, whether an actual edge exists for a given mode/date —
 * this file only ever reasons about geography, never live transport data.
 */

export interface ScoredPlace {
  place: Place;
  /** 0..1, higher = more likely to be a useful transfer point. 0.5 = neutral (no coordinates for origin, destination, or this candidate — never guessed). */
  relevance: number;
}

function haversineKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const la1 = (a.latitude * Math.PI) / 180;
  const la2 = (b.latitude * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Scores one candidate place by how much of a detour it represents for this specific origin→destination pair — the same "is this roughly on the way" logic lib/graph/hubs.ts used to apply only to train junctions, generalized to any Place. */
export function scorePlaceRelevance(candidate: Place, origin: Place, destination: Place): ScoredPlace {
  if (!origin.hasCoords || !destination.hasCoords || !candidate.hasCoords) {
    return { place: candidate, relevance: 0.5 };
  }

  const direct = haversineKm(origin, destination);
  const viaOrigin = haversineKm(origin, candidate);
  const viaDest = haversineKm(candidate, destination);

  // Candidate is basically on top of the origin or destination already — not a useful transfer.
  if (viaOrigin < 15 || viaDest < 15) return { place: candidate, relevance: 0 };

  const detourRatio = direct > 0 ? (viaOrigin + viaDest) / direct : 1;
  const relevance = Math.max(0, 1 - (detourRatio - 1) * 0.8);
  return { place: candidate, relevance };
}

/**
 * Returns the top `max` candidate places to try as a transfer point between
 * `origin` and `destination`, excluding the endpoints themselves. Pool =
 * the curated hub seed list (turned into real Places via
 * getOrCreateHubPlace — no network calls) ∪ every Place already resolved
 * this process (so a search that already touched some interesting
 * non-hub place, e.g. by resolving a bus-only city earlier in this same
 * request, can be routed through too).
 */
export function rankedPlaceNeighbors(origin: Place, destination: Place, max = 5): Place[] {
  const pool = new Map<string, Place>();
  for (const hub of DEFAULT_HUBS) {
    const p = getOrCreateHubPlace(hub);
    pool.set(p.id, p);
  }
  for (const p of allCachedPlaces()) pool.set(p.id, p);
  pool.delete(origin.id);
  pool.delete(destination.id);

  return Array.from(pool.values())
    .map((candidate) => scorePlaceRelevance(candidate, origin, destination))
    .filter((sp) => sp.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, max)
    .map((sp) => sp.place);
}
