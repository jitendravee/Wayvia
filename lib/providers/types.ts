import type { Leg, Mode } from "../graph/types";

/**
 * One "mode" of transport that can serve a direct point-to-point hop
 * between two stop codes on a given date. Train doesn't implement this —
 * it has its own richer hub-search pipeline (lib/graph/discover.ts) — but
 * every other mode plugs in here as a direct-only lookup, which matches
 * how most real bus/flight search APIs actually work (they don't reason
 * about via-junctions themselves; that's what the multimodal hub-crossing
 * in lib/journey/graphSearch.ts is for).
 *
 * TO WIRE IN A REAL API: implement `search` against the real provider,
 * returning Legs with `source: "live"`. Either keep filling `precomputed`
 * with availability/fare computed from whatever the API gives you (the
 * simplest integration — nothing else needs to change), or extend
 * lib/availability.ts's annotateWithAvailability with a per-mode lookup
 * branch if you'd rather do the availability check as a separate batched
 * step the way the train pipeline does.
 */
export interface ModeProvider {
  mode: Exclude<Mode, "train">;
  search(from: string, to: string, date: string): Promise<Leg[]>;
}

/** Tiny deterministic PRNG so the same (from, to, date, mode) always returns the same mock schedule — stable for demos and tests, not just random noise on every request. */
export function seededRandom(seedStr: string): () => number {
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) seed = (Math.imul(seed, 31) + seedStr.charCodeAt(i)) | 0;
  return function next() {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    return ((seed >>> 0) % 1_000_000) / 1_000_000;
  };
}

/** Minutes since midnight -> erail-style 'HH.MM' (matches how live train legs are formatted). */
export function minutesToHHMM(min: number): string {
  const m = ((min % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}.${String(mm).padStart(2, "0")}`;
}