import { DEFAULT_HUBS } from "../graph/hubs";
import { placeModes } from "./model";
import { normalizePlaceName } from "./resolver";
import { PlaceCache } from "./cache";
function haversineKm(a, b) {
    const R = 6371;
    const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
    const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
    const la1 = (a.latitude * Math.PI) / 180;
    const la2 = (b.latitude * Math.PI) / 180;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
}
/** Scores one candidate place by how much of a detour it represents for this specific origin→destination pair — the same "is this roughly on the way" logic lib/graph/hubs.ts used to apply only to train junctions, generalized to any Place. */
export function scorePlaceRelevance(candidate, origin, destination) {
    // Geographic scoring: how much of a detour is this candidate?
    let geoRelevance = 0.5; // Default neutral score
    if (origin.hasCoords && destination.hasCoords && candidate.hasCoords) {
        const direct = haversineKm(origin, destination);
        const viaOrigin = haversineKm(origin, candidate);
        const viaDest = haversineKm(candidate, destination);
        // Candidate is basically on top of the origin or destination already — not a useful transfer.
        if (viaOrigin < 15 || viaDest < 15) {
            geoRelevance = 0;
        }
        else if (direct > 0) {
            const detourRatio = (viaOrigin + viaDest) / direct;
            // Linear penalty: 1.0 detour ratio (no detour) = 1.0 score, 2.0 detour ratio = 0.0 score
            geoRelevance = Math.max(0, 2 - detourRatio);
        }
        // If direct is 0 (same place), geoRelevance stays 0.5 (neutral)
    }
    // If we don't have coordinates for one of the places, geoRelevance stays 0.5 (neutral)
    // Hub score: places that are known important junctions get a boost
    const hubScore = candidate.isHub ? 0.3 : 0.0;
    // Transport infrastructure score: more transport options = better transfer point
    const transportScore = (() => {
        const modes = placeModes(candidate);
        // Normalize: 0 modes = 0.0, 1 mode = 0.2, 2 modes = 0.3, 3 modes = 0.4
        return Math.min(0.4, modes.length * 0.1);
    })();
    // Combine scores with weights
    // Geographic relevance is most important (0.5 weight)
    // Hub score is secondary (0.3 weight)
    // Transport infrastructure is tertiary (0.2 weight)
    const relevance = (geoRelevance * 0.5) +
        (hubScore * 0.3) +
        (transportScore * 0.2);
    return { place: candidate, relevance: Math.min(1.0, Math.max(0.0, relevance)) };
}
/**
 * Returns the top `max` candidate places to try as a transfer point between
 * `origin` and `destination`, excluding the endpoints themselves.
 * The candidate pool is sourced from the global place dataset (countries.dev)
 * via the PlaceCache, which is seeded with comprehensive Indian places and
 * updated as places are resolved. This ensures a true global place graph
 * where cities/places are the primary nodes.
 *
 * @param externalCandidates Optional array of Place objects to use as the base pool.
 *                           If provided, the pool consists of these places plus
 *                           the resolved origin and destination (which are removed).
 *                           If not provided, the pool is sourced from the global
 *                           place dataset (PlaceCache's generalPlaces).
 */
export async function rankedPlaceNeighbors(origin, destination, max = 5, externalCandidates) {
    // Build the pool of candidate places
    const pool = new Map();
    if (externalCandidates && externalCandidates.length > 0) {
        // Use the provided external candidates as the base pool
        for (const p of externalCandidates) {
            pool.set(p.id, p);
        }
    }
    else {
        // Use the global place dataset from PlaceCache
        const placeCache = PlaceCache.getInstance();
        // Wait for seeding to complete if it's still in progress
        await placeCache.waitForSeeding();
        const generalPlaces = await placeCache.getAllGeneralPlaces();
        // Create a map of normalized names to hub seeds for quick lookup
        const hubSeedsByNormalizedName = new Map(DEFAULT_HUBS.map(hub => [normalizePlaceName(hub.name), hub]));
        // Add all general places to the pool, enriching with hub status if applicable
        for (const generalPlace of generalPlaces) {
            // Check if this place matches a hub seed to set isHub correctly
            const hubSeed = hubSeedsByNormalizedName.get(generalPlace.normalizedName);
            const placeToAdd = hubSeed
                ? {
                    ...generalPlace,
                    latitude: hubSeed.lat,
                    longitude: hubSeed.lon,
                    hasCoords: !(hubSeed.lat === 0 && hubSeed.lon === 0),
                    isHub: true,
                }
                : generalPlace;
            pool.set(placeToAdd.id, placeToAdd);
        }
    }
    // Remove origin and destination from the pool (we don't want to consider them as transfer points)
    pool.delete(origin.id);
    pool.delete(destination.id);
    // Score, filter, sort, and limit the candidates
    const scoredPlaces = Array.from(pool.values())
        .map((candidate) => scorePlaceRelevance(candidate, origin, destination))
        .filter((sp) => sp.relevance > 0)
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, max)
        .map((sp) => sp.place);
    return scoredPlaces;
}
