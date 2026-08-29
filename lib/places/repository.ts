import { resolvePlace, normalizePlaceName, placeFromHubSeed } from "./resolver";
import type { Place } from "./model";

/**
 * Process-lifetime cache: place resolution, station-code -> place, and bus
 * name -> place are all stable/semi-static data (per the architecture doc's
 * caching guidance — places don't need re-resolving every search, only
 * live availability does), so a plain in-memory Map is enough here; no TTL
 * needed the way lib/erail's live-directory caches use one, since a place
 * resolving differently mid-process would be a data bug, not a freshness
 * issue.
 */
const byId = new Map<string, Place>();
const byQuery = new Map<string, string>(); // raw query (lowercased) -> place id, so repeat lookups of the same typed text skip re-resolution entirely
const byStationCode = new Map<string, string>(); // station code -> place id, populated as a side effect of every resolution

function index(place: Place): void {
  byId.set(place.id, place);
  for (const s of place.railway?.stations ?? []) byStationCode.set(s.code.toUpperCase(), place.id);
}

/** Resolves (and caches) the canonical Place for free-text input — a station code, station name, or plain city name. */
export async function getOrCreatePlace(query: string): Promise<Place | null> {
  const key = query.trim().toLowerCase();
  if (!key) return null;

  const cachedId = byQuery.get(key);
  if (cachedId) return byId.get(cachedId) ?? null;

  const place = await resolvePlace(query);
  if (!place) return null;

  // Merge into an already-cached Place with the same id, if one exists — e.g.
  // resolving "PUNE" (a station code) after "Pune" (typed as plain text)
  // should enrich the same Place, not create a second, incomplete copy.
  const existing = byId.get(place.id);
  const merged = existing ? mergeInto(existing, place) : place;

  index(merged);
  byQuery.set(key, merged.id);
  return merged;
}

/** Get a Place by its stable ID. Returns null if not found. */
export function getPlaceById(id: string): Place | null {
  return byId.get(id) ?? null;
}

function mergeInto(existing: Place, incoming: Place): Place {
  const stations = [...(existing.railway?.stations ?? [])];
  for (const s of incoming.railway?.stations ?? []) if (!stations.some((x) => x.code === s.code)) stations.push(s);
  const busLocations = [...(existing.bus?.locations ?? [])];
  for (const b of incoming.bus?.locations ?? []) if (!busLocations.some((x) => x.name.toLowerCase() === b.name.toLowerCase())) busLocations.push(b);

  return {
    ...existing,
    hasCoords: existing.hasCoords || incoming.hasCoords,
    latitude: existing.hasCoords ? existing.latitude : incoming.latitude,
    longitude: existing.hasCoords ? existing.longitude : incoming.longitude,
    isHub: existing.isHub || incoming.isHub,
    state: existing.state ?? incoming.state,
    railway: stations.length > 0 ? { stations } : undefined,
    bus: busLocations.length > 0 ? { locations: busLocations } : undefined,
  };
}

/** Synchronous lookup for a Place already resolved this process — used for cheap display-name cleanup (see lib/availability.ts) where an async round trip isn't worth it. Returns null if this exact code hasn't been resolved yet (e.g. a station this search never actually touched). */
export function getCachedPlaceByStationCode(code: string): Place | null {
  const id = byStationCode.get(code.toUpperCase());
  return id ? byId.get(id) ?? null : null;
}

/**
 * Builds (or returns the cached copy of) a Place for a curated hub-seed
 * entry — synchronous, no network calls. This is how lib/places/graph.ts
 * turns the geo seed list into real candidate-neighbor Place objects
 * cheaply; every hub gets resolved into a Place exactly once per process.
 */
export function getOrCreateHubPlace(hub: { code: string; name: string; lat: number; lon: number }): Place {
  const seedPlace = placeFromHubSeed(hub);
  const existing = byId.get(seedPlace.id);
  const merged = existing ? mergeInto(existing, seedPlace) : seedPlace;
  index(merged);
  return merged;
}

/** Every Place resolved so far this process — the closest thing to "the sparse place graph" this in-memory implementation has; see lib/places/graph.ts for how it's used as an additional (beyond the curated seed list) source of candidate neighbors. */
export function allCachedPlaces(): Place[] {
  return Array.from(byId.values());
}

export { normalizePlaceName };

export function getPlaceByName(name: string): Place | null {
  const id = byQuery.get(name.toLowerCase());
  return id ? byId.get(id) ?? null : null;
}

export function getPlaceCoords(name: string): { lat: number; lon: number } | null {
  const place = getPlaceByName(name);
  if (place && place.hasCoords) {
    return { lat: place.latitude, lon: place.longitude };
  }
  return null;
}
