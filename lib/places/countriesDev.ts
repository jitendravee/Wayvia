import type { Place } from "./model";

/**
 * Response from countries.dev cities endpoint
 */
export interface CountriesDevCityResponse {
  name: string;
  ascii_name: string;
  alternate_names: string[];
  latitude: number;
  longitude: number;
  feature_code: string;
  feature_name: string;
  country_code: string;
  country_name: string;
  admin1_code: string;
  admin1_name: string;
  admin2_code: string;
  admin2_name: string;
  population: number;
  elevation: number;
  timezone: string;
  modification_date: string;
}

/**
 * Normalizes a countries.dev city response to our canonical Place model
 */
export function normalizeCountriesDevPlace(
  city: CountriesDevCityResponse,
  query: string
): Place {
  // Generate a stable ID based on the canonical name
  const normalizedName = city.name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/^-|-$/g, "");

  // Use the first part of the name as the ID if it's too long
  const id = normalizedName.length > 50
    ? `place_${city.name.toLowerCase().replace(/\s+/g, "-").substring(0, 30)}`
    : `place_${normalizedName}`;

  return {
    id,
    name: city.name,
    normalizedName: city.name.toLowerCase(),
    latitude: city.latitude,
    longitude: city.longitude,
    hasCoords: true,
    country: city.country_name,
    state: city.admin1_name,
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
  switch (city.feature_code) {
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