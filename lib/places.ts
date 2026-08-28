import type { Mode } from "./graph/types";
import { searchStations, type Station } from "./stations";
import { ixigoAutocomplete } from "./providers/ixigo/client";
import { cityNameFromStationName } from "./providers/ixigo/cityResolve";

/**
 * One suggestion in the unified "where are you going" search box. This is
 * the merge of two very different data sources:
 *
 *  - train stations (lib/stations.ts — erail.in's live directory + our
 *    curated seed list), identified by a real station code like "BCT".
 *  - bus-servable cities (ixigo's own place autocompleter — the same free,
 *    no-key endpoint lib/providers/ixigo/cityResolve.ts already uses to
 *    resolve a city for GetBusList), identified by nothing more than a
 *    city name — ixigo cities don't have "codes" the way stations do.
 *
 * `modes` tells the frontend (and the person) what's actually searchable
 * from this place today, so picking "Adilabad" doesn't silently promise a
 * train that doesn't exist. `code` is always what should be sent to
 * /api/search's `from`/`to` — a real station code when there is one,
 * otherwise the place name itself (which flows straight into
 * resolveIxigoCity's fallback path — see cityResolve.ts — so it still
 * resolves correctly on the bus side).
 */
export interface PlaceSuggestion {
  code: string;
  name: string;
  state?: string;
  modes: Mode[];
}

/** Ranks any (code, name) pair against the query the same way lib/stations.ts does, so train and bus results interleave sensibly instead of one source always winning. */
function relevance(query: string, code: string, name: string): number {
  const q = query.trim().toUpperCase();
  const c = code.toUpperCase();
  const n = name.toUpperCase();
  if (c === q) return 100;
  if (c.startsWith(q)) return 80;
  if (n.startsWith(q)) return 60;
  if (n.includes(q)) return 40;
  if (c.includes(q)) return 20;
  return 0;
}

/**
 * Searches stations and bus cities in parallel and merges them into one
 * ranked list. A city that has both a train station and bus coverage (the
 * common case — most Indian cities with a junction also have a bus stand)
 * shows up ONCE, tagged with every mode it supports, rather than as two
 * confusing near-duplicate rows ("Pune Junction" / "Pune"). A city ixigo
 * knows about but that has no nearby train station (small towns, hill
 * stations, anywhere the rail network doesn't reach) still shows up,
 * tagged bus-only, which is the whole point — those places used to be
 * unsearchable from this box even though the bus pipeline could already
 * serve them once you knew to type the exact name.
 *
 * flight isn't tagged yet — lib/providers/mockFlight.ts doesn't have a
 * real place directory to merge in. Once a real flight provider is wired
 * up (see lib/providers/registry.ts), add its city/airport lookup here the
 * same way ixigo is merged in below.
 */
export async function searchPlaces(query: string, limit = 8): Promise<PlaceSuggestion[]> {
  const q = query.trim();
  if (!q) return [];

  // Pull a wider pool than `limit` from each source before merging/ranking —
  // otherwise a source that scores its own top hits well but sits behind
  // the other source's noise could get starved out before the merge step
  // even sees it.
  const poolSize = Math.max(limit * 2, 16);

  const [stations, ixigoResults] = await Promise.all([
    searchStations(q, poolSize),
    ixigoAutocomplete(q).catch(() => []),
  ]);

  // alias_type "City" is ixigo's canonical, bookable place record — skip
  // sub-entities like "Hyderabad Airport RGIA" here, they'd just be
  // confusing duplicates of the city itself in a place search box.
  const busCities = ixigoResults.filter((r) => r.alias_type === "City");

  const byCityKey = new Map<string, string>(); // normalized city name -> station code that "owns" that city in the merged list
  const merged = new Map<string, PlaceSuggestion>(); // code -> suggestion

  for (const s of stations as Station[]) {
    merged.set(s.code, { code: s.code, name: s.name, state: s.state, modes: ["train"] });
    const cityKey = cityNameFromStationName(s.name).toLowerCase();
    // First station to claim a city name wins the merge target — searchStations
    // already returns its best-scored match first, so this is usually the
    // "main" station for that city (e.g. Mumbai Central over a small suburban stop).
    if (!byCityKey.has(cityKey)) byCityKey.set(cityKey, s.code);
  }

  for (const c of busCities) {
    const cityKey = c.label.trim().toLowerCase();
    const ownerCode = byCityKey.get(cityKey);
    if (ownerCode) {
      // Same city as an existing station — add bus coverage to that entry instead of duplicating it.
      const existing = merged.get(ownerCode)!;
      if (!existing.modes.includes("bus")) existing.modes.push("bus");
      continue;
    }
    // No train station for this city — bus-only place. Use the city name itself as
    // the "code"; resolveIxigoCity's text fallback (see cityResolve.ts) handles this
    // directly, and the train pipeline just won't match it, which is correct.
    const code = c.label.trim().toUpperCase();
    if (merged.has(code)) continue; // two ixigo rows resolving to the same code — keep the first
    merged.set(code, { code, name: c.label, state: c.state_name || undefined, modes: ["bus"] });
  }

  return Array.from(merged.values())
    .map((p) => ({ p, score: relevance(q, p.code, p.name) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.p.name.localeCompare(b.p.name))
    .slice(0, limit)
    .map((x) => x.p);
}
