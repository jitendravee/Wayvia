import { DEFAULT_HUBS } from "../graph/hubs";
import { searchStations } from "../stations";
import { ixigoAutocomplete } from "../providers/ixigo/client";
import { cityNameFromStationName } from "../providers/ixigo/cityResolve";
import { fetchGeonamesPlaces } from "./geonames";
import type { Place, RailwayLocation, BusLocation } from "./model";

/**
 * "Pune Junction" -> "pune", "Secunderabad Junction, Hyderabad" -> "hyderabad".
 * This is the identity function for the whole Place system — two records
 * that normalize to the same string ARE the same Place, whichever provider
 * they came from. Deliberately reuses cityNameFromStationName (already
 * battle-tested for turning erail's junction-heavy names into plain city
 * names for ixigo) rather than inventing a second, subtly different
 * normalizer.
 */
export function normalizePlaceName(rawName: string): string {
  return cityNameFromStationName(rawName).trim().toLowerCase();
}

/** Normalized name -> stable Place id. Kept as its own function (even though it's currently identical to normalizePlaceName) so the id format can change independently of the matching logic later — e.g. adding a state suffix to disambiguate same-named towns in different states. */
export function placeIdFromName(rawName: string): string {
  return normalizePlaceName(rawName).replace(/\s+/g, "-");
}

const HUB_BY_NORMALIZED_NAME = new Map(DEFAULT_HUBS.map((h) => [normalizePlaceName(h.name), h]));

/** Merges a new railway station into an existing (or brand-new) Place, deduping by station code. */
function withRailway(place: Place, station: RailwayLocation): Place {
  const stations = place.railway?.stations ?? [];
  if (stations.some((s) => s.code === station.code)) return place;
  return { ...place, railway: { stations: [...stations, station] } };
}

/** Merges a new bus location into an existing (or brand-new) Place, deduping by name. */
function withBus(place: Place, bus: BusLocation): Place {
  const locations = place.bus?.locations ?? [];
  if (locations.some((b) => b.name.toLowerCase() === bus.name.toLowerCase())) return place;
  return { ...place, bus: { locations: [...locations, bus] } };
}

function blankPlace(name: string): Place {
  const normalized = normalizePlaceName(name);
  return {
    id: placeIdFromName(name),
    name,
    normalizedName: normalized,
    latitude: 0,
    longitude: 0,
    hasCoords: false,
    type: "city",
    isHub: false,
  };
}

/**
 * Builds a Place directly from a curated hub-seed entry — no network calls,
 * no station-directory search. Used by lib/places/graph.ts to turn the
 * geo seed list into real, searchable Place objects for candidate-neighbor
 * scoring without paying an erail/ixigo round trip for every one of them
 * up front. Idempotent: called once per hub per process via
 * lib/places/repository.ts's getOrCreateHubPlace, which caches the result.
 */
export function placeFromHubSeed(hub: { code: string; name: string; lat: number; lon: number }): Place {
  const cityName = cityNameFromStationName(hub.name);
  let place = blankPlace(cityName);
  place = withRailway(place, { code: hub.code, name: hub.name });
  place = { ...place, latitude: hub.lat, longitude: hub.lon, hasCoords: !(hub.lat === 0 && hub.lon === 0), isHub: true };
  return place;
}

/**
 * Best-effort geocoding for a place the curated hub seed list doesn't know
 * the coordinates of — OpenStreetMap's Nominatim, free and keyless. This
 * is genuinely optional: every place that shows up via a real erail
 * station or ixigo city search still resolves and searches correctly
 * without coordinates (see lib/places/graph.ts — no-coordinate places just
 * score neutrally for hub-relevance instead of being excluded). Coordinates
 * only sharpen *which* places get explored as transfer points; they were
 * never required for a place to be searchable or bookable.
 *
 * NOTE: this couldn't be exercised against the real nominatim.openstreetmap.org
 * endpoint in the sandbox this was built in (outbound network there is
 * allow-listed to package registries only) — the request shape follows
 * Nominatim's documented usage policy (a single query param, a real
 * User-Agent identifying the app, response JSON parsed defensively), but
 * verify this against a live environment before relying on it.
 */
const geocodeCache = new Map<string, { lat: number; lon: number } | null>();

async function geocodePlace(name: string): Promise<{ lat: number; lon: number } | null> {
  const key = normalizePlaceName(name);
  if (geocodeCache.has(key)) return geocodeCache.get(key)!;

  let result: { lat: number; lon: number } | null = null;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=in&q=${encodeURIComponent(name)}`;
    const res = await fetch(url, { headers: { "User-Agent": "wayvia-journey-search/1.0 (place resolution)" } });
    if (res.ok) {
      const data = (await res.json()) as { lat: string; lon: string }[];
      if (data.length > 0) {
        result = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
      }
    }
  } catch (err) {
    console.error(`geocodePlace(${name}) failed:`, err);
    result = null;
  }

  geocodeCache.set(key, result);
  return result;
}

/**
 * Resolves free-text input (a station code, a station name, or a plain
 * city name typed into the search box) into a canonical Place — using
 * countries.dev as the primary source for global place discovery, then
 * enriching with transport-location data from providers.
 *
 * Never throws — an unresolvable query returns null, which callers treat
 * as "not a real place" (e.g. reject the search) rather than crashing.
 */
export async function resolvePlace(query: string): Promise<Place | null> {
  const q = query.trim();
  if (!q) return null;

  // 1) Primary: Discover the canonical place via GeoNames' own search
  // webservice (lib/places/geonames.ts) — this used to call countries.dev,
  // which mirrors only a subset of GeoNames' database and could come up
  // empty for small towns. Querying GeoNames directly means step 2's
  // erail-station fallback below only has to fire when GeoNames itself
  // has never heard of the place at all, not just when a third party's
  // partial mirror of it hasn't.
  const geonamesPlaces = await fetchGeonamesPlaces(q, 5);
  let place: Place | null = null;

  if (geonamesPlaces.length > 0) {
    // Take the best match (first result from GeoNames is already ranked by relevance)
    place = { ...geonamesPlaces[0] };

    // Override the name with the original query if it's a better match
    // This handles cases where GeoNames might return a variant name
    place.name = q;
    place.normalizedName = normalizePlaceName(q);
    place.id = placeIdFromName(q);
  }

  // 2) Fallback: If GeoNames didn't return results, use existing logic
  if (!place) {
    // 2a) A train station (matched by code or name) is the strongest signal — it
    //     pins down both the railway location AND, via cityNameFromStationName,
    //     the canonical place name.
    const stationMatches = await searchStations(q, 3);
    const bestStation = stationMatches.find((s) => s.code.toUpperCase() === q.toUpperCase()) ?? stationMatches[0];
    if (bestStation) {
      const cityName = cityNameFromStationName(bestStation.name);
      place = blankPlace(cityName);
      place = withRailway(place, { code: bestStation.code, name: bestStation.name });
      if (bestStation.state) place.state = bestStation.state;
      // Every other station in this same directory result set that maps to the
      // same city (e.g. searching "Mumbai" can surface BCT, CSMT, LTT together)
      // belongs to the same Place, not three separate ones.
      for (const s of stationMatches) {
        if (normalizePlaceName(cityNameFromStationName(s.name)) === place.normalizedName) {
          place = withRailway(place, { code: s.code, name: s.name });
        }
      }
    }

    // 2b) No station matched at all — fall back to treating the query as a plain
    //     place name (this is the bus-only-city case: no train station exists).
    if (!place) place = blankPlace(q);

    // 2c) Bus coverage — ixigo's own city autocompleter. Reuses the same
    //     resolution ixigo-backed search already does at query time, so a place
    //     tagged bus-capable here is guaranteed actually bus-searchable.
    try {
      const ixigoResults = await ixigoAutocomplete(place.normalizedName === normalizePlaceName(q) ? q : place.name);
      const cityMatch = ixigoResults.find((r) => r.alias_type === "City" && normalizePlaceName(r.label) === place!.normalizedName);
      if (cityMatch) place = withBus(place, { name: cityMatch.label, provider: "ixigo" });
    } catch (err) {
      console.error(`resolvePlace ixigo lookup for "${q}" failed:`, err);
    }

    // 2d) Coordinates + hub status from the curated geo seed list — matched by
    //     normalized name (place-level), not by any single station code, so
    //     Pune resolves to the same seed entry whether you typed "PUNE", "Pune
    //     Junction", or just "Pune".
    const hubSeed = HUB_BY_NORMALIZED_NAME.get(place.normalizedName);
    if (hubSeed) {
      place = { ...place, latitude: hubSeed.lat, longitude: hubSeed.lon, hasCoords: true, isHub: true };
    } else {
      const geo = await geocodePlace(place.name);
      if (geo) place = { ...place, latitude: geo.lat, longitude: geo.lon, hasCoords: true };
    }
  }

  // 3) Enrich the place with transport locations from all providers
  // This happens after we have the canonical place from countries.dev or fallback
  if (place) {
    // Railway locations from erail (if we haven't already added them)
    if (!place.railway || place.railway.stations.length === 0) {
      const stationMatches = await searchStations(q, 10); // Get more stations for enrichment
      const railwayStations: RailwayLocation[] = [];
      for (const s of stationMatches) {
        if (normalizePlaceName(cityNameFromStationName(s.name)) === place.normalizedName) {
          railwayStations.push({ code: s.code, name: s.name });
          if (s.state && !place.state) place.state = s.state;
        }
      }
      if (railwayStations.length > 0) {
        place.railway = { stations: railwayStations };
      }
    }

    // Bus locations from ixigo (if we haven't already added them)
    if (!place.bus || place.bus.locations.length === 0) {
      try {
        const ixigoResults = await ixigoAutocomplete(place.name);
        const busLocations: BusLocation[] = [];
        for (const r of ixigoResults) {
          if (r.alias_type === "City" && normalizePlaceName(r.label) === place.normalizedName) {
            busLocations.push({ name: r.label, provider: "ixigo" });
          }
        }
        if (busLocations.length > 0) {
          place.bus = { locations: busLocations };
        }
      } catch (err) {
        console.error(`resolvePlace ixigo enrichment for "${q}" failed:`, err);
      }
    }
  }

  return place;
}
