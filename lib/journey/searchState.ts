import type { Leg } from "../graph/types";
import type { Place } from "../places/model";

/**
 * "How did we reach this Place" — one node in the bounded search
 * lib/journey/graphSearch.ts performs. `visitedPlaceIds` is per-STATE
 * (copied, not shared) rather than one global set, so exploring one path
 * through Mumbai doesn't wrongly forbid a completely different path that
 * also happens to pass through Mumbai — see the doc's explicit warning
 * about this exact bug (Part 25 in the architecture note: "simply using a
 * global visited set can incorrectly eliminate valid alternative
 * journeys").
 */
export interface SearchState {
  currentPlace: Place;
  legs: Leg[];
  visitedPlaceIds: Set<string>;
  /** Number of transfers so far — legs.length - 1, kept as its own field since it's checked on every expansion. */
  connections: number;
  totalDurationMin: number;
  /** null once any leg in the chain has unknown fare — see lib/journey/filters.ts's maxBudget doc for why that doesn't mean "reject". */
  totalCost: number | null;
}

export function initialState(origin: Place): SearchState {
  return {
    currentPlace: origin,
    legs: [],
    visitedPlaceIds: new Set([origin.id]),
    connections: 0,
    totalDurationMin: 0,
    totalCost: 0,
  };
}
