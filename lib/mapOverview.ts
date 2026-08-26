import type { RankedResults } from "./score";
import type { AnnotatedJourney, RouteStop } from "./availability";
import type { Mode } from "./graph/types";

/** One entry on the "ways to get there" overview map — one labeled route, numbered and colored, with its full stop list ready to plot. */
export interface MapOverviewEntry {
  /** Stable id within this response, e.g. "best-overall", "cheapest" — lets the frontend keep marker colors consistent across re-renders. */
  id: string;
  /** Order this route should be numbered in on the map (1, 2, 3, ...) — matches the numbered pins used to distinguish overlapping routes. */
  rank: number;
  /** Badge text for this route, e.g. "BEST MATCH", "CHEAPEST", "FASTEST", "GOOD VALUE", "MULTIMODAL". */
  label: string;
  /** Hex color this route's line/pins should use on the map — stable per label so "CHEAPEST" is always the same color across searches. */
  color: string;
  totalFare: number | null;
  totalDurationMin: number;
  connections: number;
  fullyConfirmed: boolean;
  modes: Mode[];
  stops: RouteStop[];
}

const LABEL_COLOR: Record<string, string> = {
  "BEST MATCH": "#7c5cff",
  CHEAPEST: "#16a34a",
  FASTEST: "#f97316",
  "FEWEST CHANGES": "#0ea5e9",
  "GOOD VALUE": "#0ea5e9",
  "FULLY CONFIRMED BACKUP": "#16a34a",
  MULTIMODAL: "#db2777",
  ALTERNATIVE: "#6b7280",
};

function colorFor(label: string): string {
  return LABEL_COLOR[label] ?? "#6b7280";
}

/**
 * Turns a ranked result set into a small (≤6), deduplicated, labeled list
 * of routes for one overview map — the "big picture" view where every
 * reasonable way to get there is plotted on the same map at once, each
 * numbered and colored by what makes it worth considering (best match,
 * cheapest, fastest, good value, multimodal, ...). Mirrors the labels
 * app/components/filters.ts's `tagFor` already uses for individual journey
 * cards, so the map and the list always agree on what a route is called.
 */
export function buildMapOverview(ranked: RankedResults | null): MapOverviewEntry[] {
  if (!ranked) return [];

  const seen = new Set<AnnotatedJourney>();
  const entries: { journey: AnnotatedJourney; label: string }[] = [];

  function add(journey: AnnotatedJourney | null | undefined, label: string) {
    if (!journey || seen.has(journey)) return;
    seen.add(journey);
    entries.push({ journey, label });
  }

  add(ranked.bestOverall, "BEST MATCH");
  add(ranked.cheapest, "CHEAPEST");
  add(ranked.fastest, "FASTEST");
  add(ranked.easiest, "GOOD VALUE");
  add(ranked.mostReliable, ranked.mostReliable.fullyConfirmed ? "FULLY CONFIRMED BACKUP" : "MOST RELIABLE");

  // Surface one genuinely multimodal example (train+bus, train+flight, ...)
  // even if it didn't win any of the categories above — it's the whole
  // point of a multimodal planner, so it should always be visible on the
  // overview map when one exists.
  const multimodalPick = ranked.all.find((j) => j.modesUsed.length > 1);
  add(multimodalPick, "MULTIMODAL");

  // Fill remaining slots (up to 6 total) with the next-best alternatives so
  // the map isn't just the single winning pick.
  for (const alt of ranked.alternatives) {
    if (entries.length >= 6) break;
    add(alt, "ALTERNATIVE");
  }

  return entries.slice(0, 6).map(({ journey, label }, i) => ({
    id: `${label.toLowerCase().replace(/\s+/g, "-")}-${i}`,
    rank: i + 1,
    label,
    color: colorFor(label),
    totalFare: journey.totalFare,
    totalDurationMin: journey.totalDurationMin,
    connections: journey.connections,
    fullyConfirmed: journey.fullyConfirmed,
    modes: journey.modesUsed,
    stops: journey.routeStops,
  }));
}
