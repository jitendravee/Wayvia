import type { Place } from "./model";

/**
 * Response from countries.dev cities endpoint.
 *
 * NOTE: the real payload is camelCase (geonameId, countryCode, admin1Code,
 * featureCode, ...) — there is no snake_case country_name/admin1_name/etc,
 * and no human-readable state name, only a numeric admin1 code. An earlier
 * version of this interface assumed a snake_case shape with name fields
 * that don't exist on the actual API, which silently produced Places with
 * no country/state and made any country_code filtering match nothing.
 */
export interface CountriesDevCityResponse {
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

/**
 * Normalizes a countries.dev city response to our canonical Place model
 */
export function normalizeCountriesDevPlace(
  city: CountriesDevCityResponse,
  query: string
): Place {
  return {
    id: `place_${city.geonameId}`,
    name: city.name,
    normalizedName: city.name.toLowerCase(),
    latitude: city.latitude,
    longitude: city.longitude,
    hasCoords: true,
    // countries.dev only gives us a country CODE, not a name. Fine to
    // hardcode here since callers currently filter to countryCode === "IN"
    // before this runs; revisit if this ever serves non-India results.
    country: city.countryCode === "IN" ? "India" : city.countryCode,
    // No human-readable state name is available from this API — only a
    // numeric admin1Code (e.g. "09"). Left undefined rather than guessing;
    // add a geonames admin1-code -> state-name table here if that's needed.
    state: undefined,
    type: determinePlaceType(city),
    // Transport locations will be resolved separately by the resolver
    railway: { stations: [] },
    bus: { locations: [] },
    flight: { airports: [] },
    isHub: false // Hub status determined by resolver based on geo seed
  };
}

/**
 * Determines the place type based on feature code and other attributes
 */
function determinePlaceType(city: CountriesDevCityResponse): "city" | "town" | "village" | "region" {
  // countries.dev feature codes for populated places
  switch (city.featureCode) {
    case "PPLA": // Seat of a first-order administrative division
    case "PPLA2": // Seat of a second-order administrative division
    case "PPLA3": // Seat of a third-order administrative division
    case "PPLA4": // Seat of a fourth-order administrative division
      return "city";
    case "PPL": // Populated place
    case "PPLL": // Populated locality
      // Further refine based on population
      if (city.population >= 100000) return "city";
      if (city.population >= 10000) return "town";
      return "village";
    case "STL": // Former populated place
    case "PPLX": // Section of populated place
      return "town";
    case "RGN": // Region
      return "region";
    default:
      // Fallback based on population
      if (city.population >= 500000) return "city";
      if (city.population >= 50000) return "town";
      if (city.population >= 5000) return "village";
      return "region";
  }
}

/**
 * Fetches places from countries.dev API
 */
export async function fetchCountriesDevPlaces(
  query: string,
  limit: number = 10
): Promise<Place[]> {
  try {
    const url = `https://countries.dev/cities?q=${encodeURIComponent(query)}&limit=${limit}`;
    const response = await fetch(url);

    // Treat 404 as "no results found" rather than an error
    if (!response.ok && response.status !== 404) {
      throw new Error(`countries.dev API error: ${response.status}`);
    }

    // If we get a 404 or non-JSON response, return empty array
    if (response.status === 404) {
      return [];
    }

    const data = await response.json() as CountriesDevCityResponse[];

    // Normalize each city to our Place model
    return data.map(city => normalizeCountriesDevPlace(city, query));
  } catch (error) {
    console.error("Error fetching places from countries.dev:", error);
    return [];
  }
}