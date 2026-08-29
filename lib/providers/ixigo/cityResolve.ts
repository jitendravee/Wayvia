import { searchStations } from "../../stations";
import { ixigoAutocomplete } from "./client";
import type { IxigoAutocompleteResult } from "./types";

export interface IxigoCityMatch {
  id: number;
  label: string;
}

/** City ids are effectively permanent — a day's cache just saves a network round trip on every repeat search for the same city. */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const cache = new Map<string, { value: IxigoCityMatch | null; expiresAt: number }>();

/**
 * "Pune Junction" -> "Pune"
 * "Secunderabad Junction, Hyderabad" -> "Hyderabad"
 * "Mumbai CSMT (Chhatrapati Shivaji)" -> "Mumbai"
 * "New Delhi" -> "New Delhi"
 *
 * Our station names are written for train travellers (junction names,
 * disambiguating parentheticals); ixigo's autocompleter wants a plain city
 * name. This strips the train-specific parts down to something a city
 * search will actually match.
 */
export function cityNameFromStationName(name: string): string {
  let n = name;
  // When a station name leads with the specific station and trails with the
  // city it serves (e.g. "Secunderabad Junction, Hyderabad"), the part after
  // the comma is the actual city.
  if (n.includes(",")) n = n.split(",").pop()!.trim();
  n = n.replace(/\(.*?\)/g, "").trim();
  n = n.replace(/\b(Junction|Jn|Central|Terminus|Cantt|City|Town)\b\.?/gi, "").trim();
  n = n.replace(/\s{2,}/g, " ").trim();
  return n || name;
}

function scoreMatch(query: string, r: IxigoAutocompleteResult): number {
  const q = query.trim().toLowerCase();
  const label = r.label.trim().toLowerCase();
  let score = 0;
  // A plain "City" entry with stn_rfn=1 is the bookable, canonical record —
  // e.g. prefer Hyderabad (id 3, stn_rfn 1) over "Hyderabad Airport RGIA"
  // (stn_rfn 0) for a plain city-name query.
  if (r.alias_type === "City") score += 50;
  if (r.stn_rfn === 1) score += 20;
  if (label === q) score += 100;
  else if (label.startsWith(q)) score += 40;
  else if (label.includes(q)) score += 15;
  return score;
}

/**
 * Resolves a train station CODE — the only thing a ModeProvider gets handed
 * (see lib/providers/types.ts's ModeProvider.search signature) — to the
 * ixigo city record GetBusList needs. Two hops: our own station directory
 * turns the code into a human city name, then ixigo's own autocompleter
 * turns that name into an ixigo city id — the same lookup ixigo.com's own
 * search box does when someone types a city there.
 *
 * Never throws — an unresolvable city (typo, ixigo doesn't cover it, a
 * network hiccup) just returns null, and the bus provider treats that as
 * "no bus coverage for this pair" rather than failing the whole search.
 */
export async function resolveIxigoCity(stationCode: string): Promise<IxigoCityMatch | null> {
  const code = stationCode.trim().toUpperCase();
  const cached = cache.get(code);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  let value: IxigoCityMatch | null = null;
  try {
    const stations = await searchStations(code, 1);
    const stationName = stations[0]?.name ?? code;
    const cityQuery = cityNameFromStationName(stationName);

    const results = await ixigoAutocomplete(cityQuery);
    const ranked = results
      .map((r) => ({ r, score: scoreMatch(cityQuery, r) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);

    if (ranked.length > 0) {
      value = { id: ranked[0].r.id, label: ranked[0].r.label };
    }
  } catch (err) {
    console.error(`resolveIxigoCity(${code}) failed:`, err);
    value = null;
  }

  cache.set(code, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}
