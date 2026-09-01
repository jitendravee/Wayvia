import type { Place } from "./model";

/**
 * Real GeoNames search — the actual upstream dataset countries.dev's
 * "cities" endpoint is itself built on (that's why its records carry a
 * `geonameId`). countries.dev only mirrors a subset of it — in practice
 * closer to GeoNames' own `cities1000`/`cities5000` tier (settlements
 * above a population floor, or the seat of some administrative division) —
 * which is exactly why real, well-connected junction towns like Rohtak,
 * Jind, Marwar, or Sojat Road can be missing from it: several of those sit
 * right around or under that floor.
 *
 * This hits GeoNames' own `/searchJSON` webservice directly, scoped to
 * India and populated-place feature classes only (`featureClass=P` —
 * cities, towns AND villages, see http://www.geonames.org/export/codes.html),
 * so it returns the full breadth of the underlying database rather than
 * whatever subset countries.dev chose to mirror.
 *
 * Requires a free GeoNames account with web services enabled:
 *   1. Register:                 https://www.geonames.org/login
 *   2. Enable the free webservice: https://www.geonames.org/enablefreewebservice
 *   3. Set GEONAMES_USERNAME in your environment to that username.
 * Free tier is ~20,000 credits/day (search = 1 credit) and capped at
 * ~1 request/second — comfortably enough for an autocomplete box; if you
 * outgrow it, GeoNames sells a paid tier with higher limits, or you can
 * self-host their daily India extract (download.geonames.org/export/dump/IN.zip)
 * as a local dataset instead of calling the live webservice at all — ask
 * if you want that ingestion script built out too.
 */
export interface GeonamesCityResponse {
  geonameId: number;
  name: string;
  asciiName: string;
  countryCode: string;
  admin1Code: string;
  latitude: number;
  longitude: number;
  population: number;
  timezone: string;
  featureCode: string;
}

interface GeonamesSearchApiResult {
  geonameId: number;
  name: string;
  toponymName: string;
  countryCode: string;
  adminCode1?: string;
  lat: string;
  lng: string;
  population: number;
  fcode: string;
}

interface GeonamesSearchApiResponse {
  totalResultsCount: number;
  geonames: GeonamesSearchApiResult[];
  status?: { message: string; value: number };
}

// India is a single timezone the whole country over — safe to hardcode
// rather than pay for a second webservice call (or the FULL-style
// response) per result just to fill in a value that never varies here.
const INDIA_TIMEZONE = "Asia/Kolkata";

function normalizeGeonamesResult(r: GeonamesSearchApiResult): GeonamesCityResponse {
  return {
    geonameId: r.geonameId,
    name: r.name,
    asciiName: r.toponymName || r.name,
    countryCode: r.countryCode,
    admin1Code: r.adminCode1 ?? "00",
    latitude: parseFloat(r.lat),
    longitude: parseFloat(r.lng),
    population: r.population ?? 0,
    timezone: INDIA_TIMEZONE,
    featureCode: r.fcode,
  };
}

/**
 * Normalizes a raw GeoNames result to our canonical Place model — same
 * shape and same rules as lib/places/countriesDev.ts's
 * normalizeCountriesDevPlace, so callers/mergers don't need to care which
 * source a given Place came from.
 */
export function normalizeGeonamesPlace(city: GeonamesCityResponse): Place {
  return {
    id: `place_${city.geonameId}`,
    name: city.name,
    normalizedName: city.name.toLowerCase(),
    latitude: city.latitude,
    longitude: city.longitude,
    hasCoords: true,
    country: city.countryCode === "IN" ? "India" : city.countryCode,
    state: undefined,
    type: determinePlaceType(city),
    railway: { stations: [] },
    bus: { locations: [] },
    flight: { airports: [] },
    isHub: false,
  };
}

function determinePlaceType(city: GeonamesCityResponse): "city" | "town" | "village" | "region" {
  switch (city.featureCode) {
    case "PPLC": // capital
    case "PPLA":
    case "PPLA2":
    case "PPLA3":
    case "PPLA4":
      return "city";
    case "PPL":
    case "PPLL":
      if (city.population >= 100000) return "city";
      if (city.population >= 10000) return "town";
      return "village";
    case "STLMT":
    case "PPLX":
      return "town";
    default:
      if (city.population >= 500000) return "city";
      if (city.population >= 50000) return "town";
      if (city.population >= 5000) return "village";
      return "region";
  }
}

/**
 * Fetches place suggestions straight from GeoNames' own search webservice,
 * scoped to India and to populated-place feature classes (cities, towns,
 * AND villages) — this is the "give me every Indian place, not just the
 * big ones" source.
 *
 * Never throws: a missing/invalid username, a network failure, or a
 * rate-limit response all just resolve to an empty array so the caller can
 * fall back to (or merge with) other sources without the whole request
 * failing. Logs a clear one-time-ish warning when GEONAMES_USERNAME isn't
 * configured, since that's a setup step rather than a runtime fluke.
 */
export async function fetchGeonamesPlaces(query: string, limit: number = 10): Promise<Place[]> {
  const username = process.env.GEONAMES_USERNAME;
  if (!username) {
    console.warn(
      "[geonames] GEONAMES_USERNAME is not set — small-town place suggestions are disabled. " +
        "Register a free username at https://www.geonames.org/login, enable web services at " +
        "https://www.geonames.org/enablefreewebservice, then set GEONAMES_USERNAME."
    );
    return [];
  }

  try {
    const params = new URLSearchParams({
      q: query,
      country: "IN",
      featureClass: "P", // cities, towns, villages — see http://www.geonames.org/export/codes.html
      maxRows: String(Math.min(50, limit * 3)),
      orderby: "relevance",
      isNameRequired: "true",
      username,
    });
    const res = await fetch(`https://secure.geonames.org/searchJSON?${params.toString()}`);
    if (!res.ok) return [];

    const data = (await res.json()) as GeonamesSearchApiResponse;
    if (data.status) {
      // e.g. {"status":{"message":"the daily limit ... has been exceeded","value":18}}
      console.error(`[geonames] search error: ${data.status.message}`);
      return [];
    }

    return (data.geonames ?? [])
      .filter((r) => r.countryCode === "IN")
      .slice(0, limit)
      .map((r) => normalizeGeonamesPlace(normalizeGeonamesResult(r)));
  } catch (error) {
    console.error(`[geonames] fetchGeonamesPlaces("${query}") failed:`, error);
    return [];
  }
}
