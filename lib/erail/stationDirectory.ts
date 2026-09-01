/**
 * Live station directory.
 *
 * erail.in doesn't publish a documented "give me every station" REST
 * endpoint, but it ships a static JS asset that its own front-end loads for
 * autocomplete: https://erail.in/js5/IRTrains.js (the exact filename is
 * user-supplied; despite the "IRTrains" name it's the same family of static
 * lookup asset as the AUTOCOMPLETE/GetTrain endpoints elsewhere in this
 * codebase). This sandbox has no network egress to erail.in, so the exact
 * byte-for-byte shape of that asset could not be confirmed here — the
 * parser below is written defensively against the shapes erail.in is known
 * to use elsewhere in this codebase (see lib/erail/trainSearch.ts and
 * lib/erail/prettify.ts for the same pattern):
 *
 *   1. Plain JSON (array of records, or an object with a data/list field).
 *   2. A `var x = [...]` / `x[0]="...";` JS literal — pulled out with a
 *      regex over quoted string literals, never eval'd.
 *   3. erail's other convention: a "~~~~~~~~"-separated list of "~"-joined
 *      fields (same shape BetweenStation uses in prettify.ts).
 *
 * Every record is normalized to { code, name, state? }. If none of the
 * three shapes match anything, callers fall back to the small curated list
 * in lib/stations.ts, so autocomplete and routing keep working even if this
 * asset's format turns out to be different in production — verify against
 * a live response and tighten the parser if entries come back empty.
 *
 * SECOND ROLE — growing directory: lib/graph/dynamicHubs.ts calls
 * registerDiscoveredStations() with the real intermediate stops it reads
 * off actual train routes (via getRoute()). Those are merged in immediately
 * for the lifetime of the server process. This is what replaces the old
 * fixed ~34-station hub list: every real search that has to reach past the
 * curated hubs teaches the directory (and therefore autocomplete, and
 * therefore future hub search) about more of the real network.
 */

export interface DirectoryStation {
  code: string;
  name: string;
  state?: string;
}

/**
 * The live asset this file scrapes is undocumented (see the big comment
 * below) and, going by its own filename, is at least partly a *train* list
 * rather than a pure station list. Every parser below is a generic
 * "CODE~NAME" / "CODE - NAME" pattern-matcher, so without a filter it will
 * happily accept a train entry like "12951~MUMBAI RAJDHANI" as if it were a
 * station — which is exactly what was showing up as train numbers/names
 * inside the station search box. This guard rejects anything that looks
 * like a train record before it ever reaches the directory:
 *   - real IR station codes are alphabetic (2-6 letters); train numbers are
 *     purely numeric (4-5 digits), so a numeric-only "code" is never a
 *     station.
 *   - train *names* almost always contain a service-type word (EXPRESS,
 *     MAIL, PASSENGER, SUPERFAST, RAJDHANI, ...) that a station name never
 *     legitimately contains.
 */
const TRAIN_NAME_HINTS =
  /\b(EXPRESS|EXP|MAIL|PASSENGER|PASS|SPECIAL|SPL|SUPERFAST|SF|RAJDHANI|SHATABDI|DURONTO|GARIB\s*RATH|HUMSAFAR|JANSHATABDI|JAN\s*SHATABDI|VANDE\s*BHARAT|INTERCITY|SUVIDHA|ANTYODAYA|TEJAS|SAMPARK\s*KRANTI|YUVA|UDAY|AC\s*EXP)\b/i;

export function looksLikeStation(rec: { code: string; name: string }): boolean {
  const code = rec.code?.trim().toUpperCase() ?? "";
  const name = rec.name?.trim() ?? "";
  if (!code || !name) return false;
  // Station codes are alphabetic (occasionally with a trailing digit e.g. "H NZM" variants,
  // but never *only* digits). Train numbers are purely numeric — reject those outright.
  if (/^\d+$/.test(code)) return false;
  if (!/^[A-Z0-9]{2,8}$/.test(code)) return false;
  if (!/[A-Z]/.test(code)) return false;
  if (TRAIN_NAME_HINTS.test(name)) return false;
  return true;
}

const STATION_LIST_URL = "https://erail.in/js5/IRStations.js";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h — this is a near-static asset

let liveCache: { stations: DirectoryStation[]; fetchedAt: number } | null = null;
let inFlight: Promise<DirectoryStation[]> | null = null;

/** Grows for the life of the process. Not persisted — a restart just means the directory re-learns from live searches. */
const discovered = new Map<string, DirectoryStation>();

function ua() {
  return "Mozilla/5.0 (compatible; WayviaBot/1.0; +journey-search)";
}

function tryJsonShape(text: string): DirectoryStation[] | null {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return null;
  }
  const arr = Array.isArray(json)
    ? json
    : json && typeof json === "object"
    ? (json as Record<string, unknown>).data ?? (json as Record<string, unknown>).stations ?? (json as Record<string, unknown>).list
    : null;
  if (!Array.isArray(arr)) return null;

  const out: DirectoryStation[] = [];
  for (const item of arr) {
    if (typeof item === "string") {
      // Confirmed real shape: "NAME - CODE", e.g. "ROHTAK JN - ROK", "BABRALA - BBA".
      // The code is always the short alphanumeric token after the last " - ".
      const m = item.match(/^\s*(.+?)\s*-\s*([A-Za-z0-9]{2,8})\s*$/);
      if (m) out.push({ code: m[2].toUpperCase(), name: titleCase(m[1]) });
      continue;
    }
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const code = String(rec.code ?? rec.Code ?? rec.station_code ?? rec.StationCode ?? "").trim().toUpperCase();
    const name = String(rec.name ?? rec.Name ?? rec.station_name ?? rec.StationName ?? "").trim();
    if (!code || !name) continue;
    const state = rec.state ?? rec.State ? String(rec.state ?? rec.State).trim() : undefined;
    out.push({ code, name: titleCase(name), state });
  }
  const filtered = out.filter(looksLikeStation);
  return filtered.length ? filtered : null;
}

function tryJsLiteralShape(text: string): DirectoryStation[] | null {
  // Pull every quoted string literal out of the JS source without eval'ing it,
  // then try to read each as "CODE~NAME[~STATE]" or "CODE-NAME".
  const literals = [...text.matchAll(/["']([^"']{3,120})["']/g)].map((m) => m[1]);
  if (!literals.length) return null;

  const out: DirectoryStation[] = [];
  for (const lit of literals) {
    if (lit.includes("~")) {
      const fields = lit.split("~").filter(Boolean);
      const code = fields.find((f) => /^[A-Z0-9]{2,6}$/.test(f));
      if (!code) continue;
      const idx = fields.indexOf(code);
      const name = fields[idx + 1];
      if (!name || !/[A-Za-z]/.test(name)) continue;
      out.push({ code, name: titleCase(name), state: fields[idx + 2] });
    } else {
      const m = lit.match(/^(.+?)\s*-\s*([A-Za-z0-9]{2,8})$/);
      if (m) out.push({ code: m[2].toUpperCase(), name: titleCase(m[1]) });
    }
  }
  const filtered = out.filter(looksLikeStation);
  return filtered.length ? filtered : null;
}

function tryTildeBlockShape(text: string): DirectoryStation[] | null {
  if (!text.includes("~~~~~~~~")) return null;
  const out: DirectoryStation[] = [];
  for (const chunk of text.split("~~~~~~~~")) {
    const fields = chunk.split("~").filter(Boolean);
    const code = fields.find((f) => /^[A-Z0-9]{2,6}$/.test(f));
    if (!code) continue;
    const idx = fields.indexOf(code);
    const name = fields[idx + 1] ?? fields[idx - 1];
    if (!name) continue;
    out.push({ code, name: titleCase(name) });
  }
  const filtered = out.filter(looksLikeStation);
  return filtered.length ? filtered : null;
}

function titleCase(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Fetches + parses the live station asset, cached for CACHE_TTL_MS.
 * Never throws — returns [] on any network/parse failure so callers can
 * always fall back to the curated list without extra error handling.
 */
export async function getLiveStations(): Promise<DirectoryStation[]> {
  const now = Date.now();
  if (liveCache && now - liveCache.fetchedAt < CACHE_TTL_MS) return liveCache.stations;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const res = await fetch(`${STATION_LIST_URL}?_=${new Date().toISOString().slice(0, 10)}`, {
        headers: { "User-Agent": ua(), Accept: "*/*" },
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      });
      const text = await res.text();
      const stations = tryJsonShape(text) ?? tryTildeBlockShape(text) ?? tryJsLiteralShape(text) ?? [];
      liveCache = { stations, fetchedAt: Date.now() };
      return stations;
    } catch {
      // Keep serving a stale cache if we have one rather than going empty on a transient failure.
      if (liveCache) return liveCache.stations;
      liveCache = { stations: [], fetchedAt: Date.now() };
      return [];
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

/** Merges real stops read off an actual train route into the growing in-process directory. */
export function registerDiscoveredStations(stops: { code: string; name: string }[]): void {
  for (const s of stops) {
    const code = s.code?.trim().toUpperCase();
    const name = s.name?.trim();
    if (!code || !name) continue;
    if (!looksLikeStation({ code, name })) continue;
    if (!discovered.has(code)) {
      discovered.set(code, { code, name: titleCase(name) });
    }
  }
}

export function getDiscoveredStations(): DirectoryStation[] {
  return Array.from(discovered.values());
}

export function discoveredStationCount(): number {
  return discovered.size;
}