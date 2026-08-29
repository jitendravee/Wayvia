import type { Leg } from "../graph/types";
import type { Place } from "../places/model";
import type { SearchFilters } from "./filters";
import type { TransportProvider } from "../transport/types";

/**
 * Scores and filters transport connections based on geographic relevance and search constraints.
 * This implements the "Transport Discovery" phase of the Place Graph → Transport Discovery → Availability pipeline.
 *
 * The scoring considers:
 * 1. Geographic detour (how much the connection deviates from direct route)
 * 2. Schedule quality (departure time reasonableness, travel time efficiency)
 * 3. Provider-specific quality indicators (if available)
 */
export function scoreAndFilterConnections(
  connections: Leg[],
  filters: SearchFilters,
  origin: Place,
  destination: Place
): Leg[] {
  if (connections.length === 0) return [];

  // Score each connection
  const scored = connections.map(conn => ({
    leg: conn,
    score: calculateConnectionScore(conn, origin, destination, filters)
  }));

  // Filter out very poor connections (bottom 20% or those with score < 0.3)
  const threshold = Math.max(0.3, calculateAdaptiveThreshold(scored));
  const filtered = scored
    .filter(item => item.score >= threshold)
    .sort((a, b) => b.score - a.score) // Descending order
    .map(item => item.leg);

  // Apply beam search: keep only top N connections to prevent explosion
  const beamWidth = determineBeamWidth(filters.maxConnections ?? 2);
  return filtered.slice(0, beamWidth);
}

/**
 * Calculates a relevance score for a transport connection (0-1, higher is better)
 */
function calculateConnectionScore(
  leg: Leg,
  origin: Place,
  destination: Place,
  filters: SearchFilters
): number {
  // 1. Geographic efficiency (0-0.4 points)
  const geoScore = calculateGeographicScore(leg, origin, destination);

  // 2. Schedule quality (0-0.3 points)
  const scheduleScore = calculateScheduleScore(leg, filters);

  // 3. Provider quality indicators (0-0.2 points)
  const providerScore = calculateProviderScore(leg);

  // 4. Constraint compliance bonus (0-0.1 points)
  const constraintScore = calculateConstraintCompliance(leg, filters);

  return Math.min(1.0, geoScore + scheduleScore + providerScore + constraintScore);
}

/**
 * Calculates how geographically efficient the connection is for the origin→destination trip
 */
function calculateGeographicScore(leg: Leg, origin: Place, destination: Place): number {
  if (!origin.hasCoords || !destination.hasCoords) return 0.2; // Neutral when coords missing

  // For now, we'll use a simplified approach since we don't have coordinates for the leg's from/to
  // In a full implementation, we'd compare the leg's route to the direct origin-destination line
  // This is a placeholder that gives basic score based on whether it's moving in roughly the right direction

  // Since we don't have leg coordinates, return a moderate base score
  // A real implementation would use haversine distance calculations
  return 0.25;
}

/**
 * Calculates schedule quality score based on departure time, travel time, etc.
 */
function calculateScheduleScore(leg: Leg, filters: SearchFilters): number {
  let score = 0.15; // Base score

  // Prefer reasonable departure times (not too early/late)
  const hour = new Date(leg.departure.split(':')[0] as unknown as number).getHours(); // Simplified
  if (hour >= 6 && hour <= 22) { // Daytime travel preferred
    score += 0.1;
  }

  // Prefer shorter travel times (inverse relationship)
  const travelTimeHours = parseInt(leg.travelTime.split(':')[0]) || 0;
  if (travelTimeHours <= 2) {
    score += 0.05; // Short journeys good
  } else if (travelTimeHours <= 6) {
    score += 0.02; // Medium journeys okay
  } // Long journeys get no bonus

  return Math.min(0.3, score);
}

/**
 * Calculates provider-specific quality score
 */
function calculateProviderScore(leg: Leg): number {
  // For now, give equal score to all provider types
  // In future, could favor more reliable providers or those with better data quality
  return 0.1;
}

/**
 * Calculates bonus for constraint compliance
 */
function calculateConstraintCompliance(leg: Leg, filters: SearchFilters): number {
  // This would check against filters like budget, preferred times, etc.
  // For now, return small bonus if we have the leg (means it passed basic validation)
  return leg ? 0.05 : 0;
}

/**
 * Calculates adaptive threshold based on score distribution
 */
function calculateAdaptiveThreshold(scored: { leg: Leg; score: number }[]): number {
  if (scored.length < 2) return 0.3;

  const scores = scored.map(s => s.score).sort((a, b) => a - b);
  const idx = Math.floor(scores.length * 0.2); // Bottom 20%
  return scores[idx] || 0.3;
}

/**
 * Determines beam width based on max connections
 * Higher connection counts need wider beams to explore more possibilities
 */
function determineBeamWidth(maxConnections: number): number {
  // Base width, increases slightly with connection count to allow more exploration
  // for complex multi-leg journeys
  const baseWidth = 10;
  return baseWidth + (maxConnections - 1) * 2;
}