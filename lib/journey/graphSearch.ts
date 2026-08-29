import type { Leg } from "../graph/types";
import type { Place } from "../places/model";
import { rankedPlaceNeighbors } from "../places/graph";
import { getProvider } from "../transport/registry";
import { allCachedPlaces, getOrCreatePlace, getPlaceById } from "../places/repository";
import { searchStations } from "../stations";
import { cityNameFromStationName } from "../providers/ixigo/cityResolve";
import type { SearchFilters } from "./filters";
import type { SearchState } from "./searchState";
import { initialState } from "./searchState";
import { canConnect, withinBudget, withinDuration, withinDepartureWindow, withinArrivalWindow } from "./connectionValidator";
import { scoreAndFilterConnections } from "./transportRanking";

// Debug flag for graph search - set to true to enable detailed logging
const DEBUG_GRAPH_SEARCH = true;

// Helper function to resolve a station code to a Place object
async function resolvePlaceFromStationCode(stationCode: string): Promise<Place | null> {
  try {
    const stations = await searchStations(stationCode, 1); // Get best match
    if (stations.length === 0) return null;
    const bestStation = stations[0];
    const cityName = cityNameFromStationName(bestStation.name);
    return await getOrCreatePlace(cityName);
  } catch (err) {
    if (DEBUG_GRAPH_SEARCH) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`[GRAPH SEARCH] Failed to resolve place from station code ${stationCode}:`, message);
    }
    return null;
  }
}

/**
 * `GraphSearch.ts` from the architecture doc — the actual bounded,
 * multi-criteria graph traversal over Places. Algorithm choice: bounded
 * best-first expansion with a shrinking candidate pool per hop (5
 * candidates → 3 → destination-only), rather than unbounded BFS/Dijkstra
 * over every possible Place. Justification: with real network calls to
 * live providers on every edge (erail, ixigo), an unbounded or
 * wide-fan-out search would violate the doc's own performance
 * requirement ("do NOT query 500 places") — a shrinking, geography-scored
 * candidate pool (see lib/places/graph.ts's rankedPlaceNeighbors, the
 * CandidatePlaceGenerator) keeps total provider calls in the dozens even
 * at maxConnections=2, while still being a real graph search (not a
 * hardcoded 2-city hop) since the candidate pool is entirely data-driven.
 *
 * `maxConnections` is capped at MAX_CONNECTIONS_CAP regardless of what the
 * filter requests, for the same performance reason — 3 legs already
 * covers "train partway, bus for the gap, train again", the scenario this
 * architecture exists to support; deeper chains would multiply provider
 * calls combinatorially for diminishing real-world value.
 */
const MAX_CONNECTIONS_CAP = 2;
const NEIGHBOR_POOL_FIRST_HOP = 5;
const NEIGHBOR_POOL_LATER_HOP = 3;
// Number of transport-derived candidates to consider per mode
const TRANSPORT_DERIVED_CANDIDATES_PER_MODE = 2;

function dedupeById(places: Place[]): Place[] {
  const seen = new Map<string, Place>();
  for (const p of places) if (!seen.has(p.id)) seen.set(p.id, p);
  return Array.from(seen.values());
}

export interface JourneyPath {
  legs: Leg[];
}

/**
 * Explores every reachable journey from `origin` to `destination` using
 * only the requested modes, bounded by `filters`. Now generates transfer
 * candidates from actual transport discoveries rather than relying solely
 * on predefined hubs and previously resolved places.
 */
export async function multimodalGraphSearch(origin: Place, destination: Place, date: string, filters: SearchFilters): Promise<JourneyPath[]> {
  const effectiveMaxConnections = Math.min(filters.maxConnections, MAX_CONNECTIONS_CAP);
  const maxLegs = effectiveMaxConnections + 1;
  const results: JourneyPath[] = [];

  // Request deduplication (architecture doc Part 31/41): the same
  // (fromPlace, toPlace, mode) edge can be asked for by multiple branches
  // of the search (e.g. two different 3-leg chains both passing through
  // the same hub) — fetch it over the network at most once per search.
  const edgeCache = new Map<string, Promise<Leg[]>>();
  function fetchEdges(from: Place, to: Place, mode: Leg["mode"]): Promise<Leg[]> {
    const key = `${from.id}|${to.id}|${mode}`;
    let pending = edgeCache.get(key);
    if (!pending) {
      pending = getProvider(mode)
        .searchConnections(from, to, date, { transferBufferMin: filters.transferBufferMin })
        .then((legs) => scoreAndFilterConnections(legs, filters, from, to))
        .catch((err) => {
          console.error(`multimodalGraphSearch: ${mode} ${from.id}->${to.id} failed:`, err);
          return [];
        });
      edgeCache.set(key, pending);
    }
    return pending;
  }

  async function expand(state: SearchState): Promise<void> {
    if (state.legs.length > 0 && state.currentPlace.id === destination.id) {
      results.push({ legs: state.legs });
      return; // reached the destination — don't keep searching past it on this path
    }
    if (state.legs.length >= maxLegs) return;

    const isLastAllowedHop = state.legs.length === maxLegs - 1;

    // Generate candidate places from transport discoveries
    let transportDerivedCandidates: Place[] = [];

    // If not at the destination yet, derive candidates from actual transport results
    if (!isLastAllowedHop) {
      // For each mode, discover what transport legs are actually available from current state
      for (const mode of filters.modes) {
        try {
          // Use rankedPlaceNeighbors to get geographically relevant destinations to query
          // This helps us discover what's actually available in the vicinity of our current position
          const geographicTargets = rankedPlaceNeighbors(state.currentPlace, destination, NEIGHBOR_POOL_FIRST_HOP * 2);

          // Also always include the destination for direct connection discovery
          const targetPlaces = new Set<Place>([destination, ...geographicTargets]);

          // Add some previously resolved places for connectivity (limited to avoid too many queries)
          const cachedPlaces = allCachedPlaces();
          for (let i = 0; i < Math.min(4, cachedPlaces.length); i++) {
            const place = cachedPlaces[i];
            if (place.id !== state.currentPlace.id && !targetPlaces.has(place)) {
              targetPlaces.add(place);
            }
          }

          // Query connections to each target and collect the discovered destination places
          const connectionsPromises = Array.from(targetPlaces).map(async (target) => {
            try {
              const legs = await fetchEdges(state.currentPlace, target, mode);
              // Extract destination places from connections and resolve them to Place objects
              const placePromises = legs.map(async (leg) => {
                // leg.to is a string ID (station code), resolve it to a Place object
                const placeId = leg.to;
                const placeObj = await resolvePlaceFromStationCode(placeId);
                return placeObj ? placeObj : null;
              });
              const resolvedPlaces = await Promise.all(placePromises);
              return resolvedPlaces.filter((p): p is Place => p !== null);
            } catch (err:any) {
              // Silently fail for individual targets to avoid stopping the whole search
              if (DEBUG_GRAPH_SEARCH) {
                console.log(`[GRAPH SEARCH]   -> Query to ${target.name} failed:`, err.message);
              }
              return [] as Place[];
            }
          });

          const connectionsResults = await Promise.all(connectionsPromises);

          // Flatten and deduplicate the discovered destination places
          for (const placesArray of connectionsResults) {
            for (const place of placesArray) {
              // Avoid adding the current place back as a candidate (would cause loops)
              // Also avoid places we've already visited in this path
              if (place && place.id !== state.currentPlace.id && !state.visitedPlaceIds.has(place.id)) {
                transportDerivedCandidates.push(place);
              }
            }
          }
        } catch (err) {
          // Continue with other modes if one fails
          console.warn(`Error processing mode ${mode} for transport-derived candidates:`, err);
        }
      }

      // Deduplicate transport-derived candidates and limit quantity
      transportDerivedCandidates = dedupeById(transportDerivedCandidates);
      if (transportDerivedCandidates.length > TRANSPORT_DERIVED_CANDIDATES_PER_MODE * filters.modes.length) {
        transportDerivedCandidates.splice(TRANSPORT_DERIVED_CANDIDATES_PER_MODE * filters.modes.length);
      }
    }

    // Get geography-based candidates (existing behavior as fallback)
    const geographyCandidates = isLastAllowedHop
      ? [destination]
      : dedupeById([destination, ...rankedPlaceNeighbors(state.currentPlace, destination, NEIGHBOR_POOL_FIRST_HOP)]).filter((p) => !state.visitedPlaceIds.has(p.id));

    // Combine candidates: transport-derived first (higher priority), then geography-based
    const combinedCandidates: Place[] = [];
    const seenIds = new Set<string>();

    // Add transport-derived candidates first (they're based on actual connections)
    for (const place of transportDerivedCandidates) {
      if (place && !seenIds.has(place.id)) {
        seenIds.add(place.id);
        combinedCandidates.push(place);
      }
    }

    // Add geography-based candidates to fill up to desired pool size
    const targetPoolSize = isLastAllowedHop ? 1 : Math.max(NEIGHBOR_POOL_LATER_HOP, transportDerivedCandidates.length + 2);
    for (const place of geographyCandidates) {
      if (place && combinedCandidates.length >= targetPoolSize) break;
      if (place && !seenIds.has(place.id)) {
        seenIds.add(place.id);
        combinedCandidates.push(place);
      }
    }

    const candidates = combinedCandidates.filter((p): p is Place => p !== null);

    await Promise.all(
      candidates.map(async (candidate) => {
        await Promise.all(
          filters.modes.map(async (mode) => {
            // Allow any sequence of modes - transfer validation and constraints will filter invalid journeys
            const prevLeg = state.legs[state.legs.length - 1];

            const legs = await fetchEdges(state.currentPlace, candidate, mode);
            for (const leg of legs) {
              if (prevLeg) {
                if (!canConnect(prevLeg, leg, filters)) continue;
              } else if (!withinDepartureWindow(leg, filters)) {
                continue;
              }

              const legFare = leg.precomputed?.fare ?? null;
              const newCost = legFare == null || state.totalCost == null ? null : state.totalCost + legFare;
              if (!withinBudget(newCost, filters)) continue;

              const gapMin = prevLeg ? leg.depAbsMin - leg.arrAbsMin : 0;
              const newDuration = state.totalDurationMin + (leg.arrAbsMin - leg.depAbsMin) + gapMin;
              if (!withinDuration(newDuration, filters)) continue;

              if (candidate.id === destination.id && !withinArrivalWindow(leg, filters)) continue;

              const nextState: SearchState = {
                currentPlace: candidate,
                legs: [...state.legs, leg],
                visitedPlaceIds: new Set(state.visitedPlaceIds).add(candidate.id),
                connections: state.legs.length, // about to have state.legs.length+1 legs => that many transfers
                totalDurationMin: newDuration,
                totalCost: newCost,
              };
              await expand(nextState);
            }
          })
        );
      })
    );
  }

  await expand(initialState(origin));
  return results;
}