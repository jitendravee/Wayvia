/**
 * erail.in/train-fare/{trainNo} — the site's dedicated fare-lookup page.
 *
 * Unlike s.erail.in/getvalue's "_f" blob (undocumented positional fields —
 * see avl.ts), this page returns a real HTML fare table: one row for
 * General, one for Tatkal, one column per class the train actually offers.
 * It's per (trainNo, from, to) — NOT per class/quota — so a single fetch
 * gives you every class × {General, Tatkal} combination for that leg at
 * once. That's exploited below: results are cached per (trainNo, from, to)
 * so that switching travel class or quota in the UI (FiltersBar's
 * refineByClassQuota) can often be satisfied from cache instead of hitting
 * erail.in again for the exact same leg.
 *
 * Verified against a real sample (11302 UDYAN EXP, SBC -> CSMT):
 *   General: 1A 3,520 · 2A 2,100 · 3A 1,475 · SL 567 · 3E 1,380
 *   Tatkal:  1A -     · 2A 2,625 · 3A 1,895 · SL 730 · 3E 1,780
 * The parser below reproduces those exact numbers from that HTML.
 */

export interface TrainFareEntry {
  /** Class code as erail prints it, e.g. "1A", "2A", "3A", "SL", "3E", "CC", "2S". */
  travelClass: string;
  general: number | null;
  /** Null both when Tatkal isn't offered in this class (shown as "-") and when the class has no Tatkal column at all. */
  tatkal: number | null;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, "").trim();
}

/**
 * Parses the FIRST `tableSingleFare` table on the page — the "Total fare
 * for N Adult(s)" panel — which is exactly the per-passenger fare we want
 * since every request is made with adult=1&child=0. (The page also has a
 * second `tableSingleFare` table, "Individual passenger fare" with
 * Adult/Child/Adult Tatkal/Child Tatkal rows — intentionally ignored here,
 * it's redundant with adult=1&child=0 and only adds parsing edge cases.)
 */
export function parseTrainFareHtml(html: string): TrainFareEntry[] {
  const tableMatch = html.match(/<table[^>]*class=['"]tableSingleFare[^'"]*['"][^>]*>([\s\S]*?)<\/table>/);
  if (!tableMatch) return [];

  const rows = [...tableMatch[1].matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map((m) => m[1]);
  if (rows.length === 0) return [];

  // Header row: blank corner cell + one <th> per class.
  const headerCells = [...rows[0].matchAll(/<th>([\s\S]*?)<\/th>/g)].map((m) => stripTags(m[1]));
  const classes = headerCells.filter((c) => c.length > 0);
  if (classes.length === 0) return [];

  const entries: TrainFareEntry[] = classes.map((c) => ({ travelClass: c, general: null, tatkal: null }));

  for (const row of rows.slice(1)) {
    const cells = [...row.matchAll(/<td>([\s\S]*?)<\/td>/g)].map((m) => stripTags(m[1]));
    if (cells.length < 2) continue;

    const label = cells[0].trim().toLowerCase();
    if (label !== "general" && label !== "tatkal") continue; // skip anything unexpected rather than guess

    cells.slice(1).forEach((raw, i) => {
      if (i >= entries.length) return;
      const cleaned = raw.replace(/,/g, "").trim();
      const value = cleaned === "" || cleaned === "-" ? null : Number(cleaned);
      const fare = value !== null && !Number.isNaN(value) ? value : null;
      if (label === "general") entries[i].general = fare;
      else entries[i].tatkal = fare;
    });
  }

  return entries;
}

/** Picks the right column for a given class/quota out of a parsed fare table. */
export function getFareForClassQuota(entries: TrainFareEntry[], travelClass: string, quota: string): number | null {
  const entry = entries.find((e) => e.travelClass.toUpperCase() === travelClass.toUpperCase());
  if (!entry) return null;

  // erail's fare page only ever has two columns, General and Tatkal — any
  // other quota (Ladies, Premium Tatkal, ...) doesn't have its own figure
  // there, so General is the closest real number available rather than
  // guessing an adjustment.
  if (quota.toUpperCase() === "TQ") return entry.tatkal ?? entry.general;
  return entry.general ?? entry.tatkal;
}

interface CacheEntry {
  entries: TrainFareEntry[];
  fetchedAt: number;
}

const fareCache = new Map<string, CacheEntry>();
const FARE_CACHE_TTL_MS = 15 * 60 * 1000; // fares don't move fast enough to justify refetching within a session

function cacheKey(trainNo: string, from: string, to: string): string {
  return `${trainNo}_${from}_${to}`;
}

/** Fetches (or returns cached) full fare table for one train leg — every class × {General, Tatkal}. */
export async function fetchTrainFare(trainNo: string, from: string, to: string): Promise<TrainFareEntry[]> {
  const key = cacheKey(trainNo, from, to);
  const cached = fareCache.get(key);
  if (cached && Date.now() - cached.fetchedAt < FARE_CACHE_TTL_MS) {
    return cached.entries;
  }

  const url = `https://erail.in/train-fare/${encodeURIComponent(trainNo)}?from=${encodeURIComponent(
    from
  )}&to=${encodeURIComponent(to)}&adult=1&child=0`;

  try {
    const res = await fetch(url, {
      headers: {
        accept: "text/html",
        referer: "https://erail.in/",
        "user-agent": "Mozilla/5.0 (compatible; WayviaFareBot/1.0)",
      },
    });
    if (!res.ok) {
      console.error(`[erail fare] ${trainNo} ${from}->${to} returned ${res.status}`);
      return [];
    }
    const html = await res.text();
    const entries = parseTrainFareHtml(html);
    fareCache.set(key, { entries, fetchedAt: Date.now() });
    return entries;
  } catch (err) {
    console.error(`[erail fare] fetch failed for ${trainNo} ${from}->${to}:`, err);
    return [];
  }
}

/**
 * Fetches fare tables for many legs at once, deduped by (trainNo, from,
 * to) and capped at a small concurrency so a search with hundreds of
 * candidate journeys doesn't fire hundreds of parallel requests at
 * erail.in — most candidates reuse the same handful of physical train legs
 * anyway (e.g. the same PUNE->KYN service appears across dozens of
 * different multi-hub candidates), so the dedup alone does most of the
 * work before concurrency limiting even matters.
 */
export async function fetchTrainFares(
  legs: { trainNo: string; from: string; to: string }[],
  concurrency = 5
): Promise<Map<string, TrainFareEntry[]>> {
  const unique = new Map<string, { trainNo: string; from: string; to: string }>();
  for (const leg of legs) {
    unique.set(cacheKey(leg.trainNo, leg.from, leg.to), leg);
  }
  const queue = [...unique.entries()];
  const result = new Map<string, TrainFareEntry[]>();

  let cursor = 0;
  async function worker() {
    while (cursor < queue.length) {
      const [key, leg] = queue[cursor++];
      const entries = await fetchTrainFare(leg.trainNo, leg.from, leg.to);
      if (entries.length > 0) result.set(key, entries);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, worker));
  return result;
}