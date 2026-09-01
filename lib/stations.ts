import { DEFAULT_HUBS } from "./graph/hubs";
import { getLiveStations, getDiscoveredStations, looksLikeStation, DirectoryStation } from "./erail/stationDirectory";

export interface Station {
  code: string;
  name: string;
  state?: string;
}

/**
 * Small curated seed list — kept for two reasons even now that station
 * search is live-backed: (1) it supplies nicer, disambiguated display names
 * ("Mumbai CSMT (Chhatrapati Shivaji)") than a raw timetable feed usually
 * has, and (2) it's the instant, zero-network fallback if erail.in's live
 * station asset is ever unreachable or returns an unrecognized shape — the
 * search box should never go blank just because a live fetch failed.
 */
const EXTRA_STATIONS: Station[] = [
  { code: "BCT", name: "Mumbai Central", state: "Maharashtra" },
  { code: "CSMT", name: "Mumbai CSMT (Chhatrapati Shivaji)", state: "Maharashtra" },
  { code: "PUNE", name: "Pune Junction", state: "Maharashtra" },
  { code: "SBC", name: "Bengaluru City (KSR Bengaluru)", state: "Karnataka" },
  { code: "MAS", name: "Chennai Central", state: "Tamil Nadu" },
  { code: "HWH", name: "Howrah Junction, Kolkata", state: "West Bengal" },
  { code: "NDLS", name: "New Delhi", state: "Delhi" },
  { code: "SC", name: "Secunderabad Junction, Hyderabad", state: "Telangana" },
  { code: "JP", name: "Jaipur Junction", state: "Rajasthan" },
  { code: "ADI", name: "Ahmedabad Junction", state: "Gujarat" },
  { code: "LKO", name: "Lucknow Charbagh", state: "Uttar Pradesh" },
  { code: "PNBE", name: "Patna Junction", state: "Bihar" },
  { code: "BBS", name: "Bhubaneswar", state: "Odisha" },
  { code: "GHY", name: "Guwahati", state: "Assam" },
  { code: "TVC", name: "Thiruvananthapuram Central", state: "Kerala" },
  { code: "ERS", name: "Ernakulam Junction, Kochi", state: "Kerala" },
  { code: "MAO", name: "Madgaon, Goa", state: "Goa" },
  { code: "ASR", name: "Amritsar Junction", state: "Punjab" },
  { code: "CDG", name: "Chandigarh", state: "Chandigarh" },
  { code: "DDN", name: "Dehradun", state: "Uttarakhand" },
  { code: "JU", name: "Jodhpur Junction", state: "Rajasthan" },
  { code: "UDZ", name: "Udaipur City", state: "Rajasthan" },
  { code: "INDB", name: "Indore Junction", state: "Madhya Pradesh" },
  { code: "BPL", name: "Bhopal Junction", state: "Madhya Pradesh" },
  { code: "NGP", name: "Nagpur Junction", state: "Maharashtra" },
  { code: "VSKP", name: "Visakhapatnam", state: "Andhra Pradesh" },
  { code: "TPTY", name: "Tirupati", state: "Andhra Pradesh" },
  { code: "MYS", name: "Mysuru Junction", state: "Karnataka" },
  { code: "CBE", name: "Coimbatore Junction", state: "Tamil Nadu" },
  { code: "MDU", name: "Madurai Junction", state: "Tamil Nadu" },
];

/** Static fallback directory — used only if the live fetch fails entirely. */
const STATIC_SEED: Station[] = (() => {
  const byCode = new Map<string, Station>();
  for (const h of DEFAULT_HUBS) byCode.set(h.code, { code: h.code, name: h.name });
  for (const s of EXTRA_STATIONS) byCode.set(s.code, s); // extra entries win — richer city names
  return Array.from(byCode.values());
})();

/**
 * buildDirectory() used to redo this entire merge (and the caller redid the
 * looksLikeStation filter over the whole result) on *every single*
 * searchStations() call. That was fine back when station resolution mostly
 * failed silently, but now that lib/journey/graphSearch.ts resolves a real
 * station code for every leg of every candidate — often dozens of distinct
 * codes per search — this became an O(directory size) scan repeated dozens
 * of times per request. Cache the merged+filtered directory and only rebuild
 * it when its inputs actually change (live asset refetched, or new stations
 * discovered from real routes).
 */
let cachedDirectory: { key: string; stations: Station[]; byCode: Map<string, Station> } | null = null;

/**
 * Builds the full directory this request should search against: curated
 * seed + hub list, live erail.in station asset (cached ~6h), and whatever
 * this server process has learned from real train routes since it started.
 * Never throws — a failed live fetch just means the directory is a bit
 * smaller for this request, not that search breaks.
 */
async function buildDirectory(): Promise<{ stations: Station[]; byCode: Map<string, Station> }> {
  let live: DirectoryStation[] = [];
  try {
    live = await getLiveStations();
  } catch {
    live = [];
  }
  const discovered = getDiscoveredStations();

  // getLiveStations()/getDiscoveredStations() are already cached/incremental themselves,
  // so their lengths are a cheap, good-enough signal that the merged directory is stale.
  const key = `${live.length}:${discovered.length}`;
  if (cachedDirectory && cachedDirectory.key === key) return cachedDirectory;

  const byCode = new Map<string, Station>();
  for (const s of STATIC_SEED) byCode.set(s.code, s);
  for (const s of live) {
    // Curated entries already have nicer names — don't overwrite those, only fill gaps.
    if (!byCode.has(s.code)) byCode.set(s.code, s);
  }
  for (const s of discovered) {
    if (!byCode.has(s.code)) byCode.set(s.code, s);
  }

  // Defense-in-depth: even though the live directory is already filtered at the
  // source (see lib/erail/stationDirectory.ts), never let a train-shaped record
  // (numeric code, "EXPRESS"/"MAIL"/etc in the name) reach the station search box —
  // this is a *station* search, never a train search.
  const stations = Array.from(byCode.values()).filter(looksLikeStation);

  const byCodeUpper = new Map<string, Station>();
  for (const s of stations) byCodeUpper.set(s.code.toUpperCase(), s);

  cachedDirectory = { key, stations, byCode: byCodeUpper };
  return cachedDirectory;
}

/**
 * Ranks matches: exact code match first, then code-starts-with, then
 * name-starts-with, then name-contains. Keeps the dropdown feeling
 * "typeahead smart" rather than a plain filter.
 */
export async function searchStations(query: string, limit = 8): Promise<Station[]> {
  const q = query.trim().toUpperCase();
  if (!q) return [];

  const { stations: directory, byCode } = await buildDirectory();

  // Fast path for the single-best-match case (this is exactly what
  // lib/journey/graphSearch.ts's resolvePlaceFromStationCode does, dozens of
  // times per search, with an exact IR station code): an exact code match
  // always scores highest (100) and wins alone anyway, so when limit is 1
  // skip scoring the entire directory and look it up directly.
  if (limit === 1) {
    const exact = byCode.get(q);
    if (exact) return [exact];
  }

  const scored = directory
    .map((s) => {
      const code = s.code.toUpperCase();
      const name = s.name.toUpperCase();
      let score = -1;
      if (code === q) score = 100;
      else if (code.startsWith(q)) score = 80;
      else if (name.startsWith(q)) score = 60;
      else if (name.includes(q)) score = 40;
      else if (code.includes(q)) score = 20;
      return { s, score };
    })
    .filter((x) => x.score > 0);

  scored.sort((a, b) => b.score - a.score || a.s.name.localeCompare(b.s.name));
  return scored.slice(0, limit).map((x) => x.s);
}

/** Sync, static-only list — for places that need a station name without an async round trip (e.g. server components rendering hub badges). */
export const ALL_STATIONS_STATIC: Station[] = [...STATIC_SEED].sort((a, b) => a.name.localeCompare(b.name));