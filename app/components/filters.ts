import type { AnnotatedJourney, Mode, RankedResults } from "../types";

export type SortKey = "best" | "cheapest" | "fastest" | "fewestChanges";
export type ConnectionFilter = "any" | "direct" | "oneChange" | "twoChanges" | "threeChanges";
export type DepartureWindow = "any" | "morning" | "afternoon" | "evening" | "night";
/** "mixed" = journeys that genuinely combine 2+ modes (e.g. train + bus), not just "any of train/bus/flight". */
export type TransportFilter = "any" | Mode | "mixed";

export interface FilterState {
  sort: SortKey;
  connections: ConnectionFilter;
  confirmedOnly: boolean;
  departure: DepartureWindow;
  /** Arrival-time window, same buckets as `departure` but checked against the last leg's arrival. */
  arrival: DepartureWindow;
  maxFare: number | null; // null = no cap
  /** Total door-to-door duration cap, in minutes. null = no cap. */
  maxDuration: number | null;
  /** Which mode(s) a journey must use to show up — client-side only, since the backend already searched every mode. */
  transport: TransportFilter;
}

export const DEFAULT_FILTERS: FilterState = {
  sort: "best",
  connections: "any",
  confirmedOnly: false,
  departure: "any",
  arrival: "any",
  maxFare: null,
  maxDuration: null,
  transport: "any",
};

// Class/quota aren't part of FilterState on purpose: unlike the filters below,
// they change what the backend actually queries (fare + seat availability are
// class/quota-specific), so they live on the FiltersBar UI but are wired to
// trigger a fresh /api/search call rather than a client-side re-filter. See
// PageClient's refineByClassQuota.
export const TRAVEL_CLASS_OPTIONS: { value: string; label: string }[] = [
  { value: "1A", label: "1A · AC First" },
  { value: "2A", label: "2A · AC 2-Tier" },
  { value: "3A", label: "3A · AC 3-Tier" },
  { value: "SL", label: "SL · Sleeper" },
  { value: "3E", label: "3E · AC 3 Economy" },
  { value: "CC", label: "CC · AC Chair Car" },
  { value: "2S", label: "2S · Second Sitting" },
];

export const QUOTA_OPTIONS: { value: string; label: string }[] = [
  { value: "GN", label: "General" },
  { value: "TQ", label: "Tatkal" },
  { value: "LD", label: "Ladies" },
];

export const TRANSPORT_OPTIONS: { value: TransportFilter; label: string }[] = [
  { value: "any", label: "All modes" },
  { value: "train", label: "Train" },
  { value: "bus", label: "Bus" },
  { value: "flight", label: "Flight" },
  { value: "mixed", label: "Mix (multimodal)" },
];

const VALID_SORT: SortKey[] = ["best", "cheapest", "fastest", "fewestChanges"];
const VALID_CONNECTIONS: ConnectionFilter[] = ["any", "direct", "oneChange", "twoChanges", "threeChanges"];
const VALID_WINDOW: DepartureWindow[] = ["any", "morning", "afternoon", "evening", "night"];
const VALID_TRANSPORT: TransportFilter[] = ["any", "train", "bus", "flight", "mixed"];

/**
 * Reads whichever FilterState fields are present (and valid) in the URL —
 * used to restore a person's filters after a refresh, or from a shared
 * link. Fields that are absent or fail validation are simply left out of
 * the returned partial; callers merge this over DEFAULT_FILTERS so a
 * malformed/missing param can never produce an invalid FilterState.
 */
export function parseFiltersFromSearchParams(params: URLSearchParams): Partial<FilterState> {
  const out: Partial<FilterState> = {};

  const sort = params.get("sort");
  if (sort && VALID_SORT.includes(sort as SortKey)) out.sort = sort as SortKey;

  const connections = params.get("connections");
  if (connections && VALID_CONNECTIONS.includes(connections as ConnectionFilter)) {
    out.connections = connections as ConnectionFilter;
  }

  const confirmedOnly = params.get("confirmedOnly");
  if (confirmedOnly !== null) out.confirmedOnly = confirmedOnly === "true";

  const departure = params.get("departure");
  if (departure && VALID_WINDOW.includes(departure as DepartureWindow)) out.departure = departure as DepartureWindow;

  const arrival = params.get("arrival");
  if (arrival && VALID_WINDOW.includes(arrival as DepartureWindow)) out.arrival = arrival as DepartureWindow;

  const maxFare = params.get("maxFare");
  if (maxFare !== null && maxFare !== "" && !Number.isNaN(Number(maxFare))) out.maxFare = Number(maxFare);

  const maxDuration = params.get("maxDuration");
  if (maxDuration !== null && maxDuration !== "" && !Number.isNaN(Number(maxDuration))) out.maxDuration = Number(maxDuration);

  const transport = params.get("transport");
  if (transport && VALID_TRANSPORT.includes(transport.toLowerCase() as TransportFilter)) {
    out.transport = transport.toLowerCase() as TransportFilter;
  }

  return out;
}

/**
 * Writes `filters` onto a URLSearchParams (mutates the instance passed in —
 * callers typically pass a fresh copy of the current params so unrelated
 * keys like from/to/date survive). Any field that's still at its
 * DEFAULT_FILTERS value is deleted rather than written, so the URL only
 * ever carries the filters someone actually changed — keeps shared links
 * short and avoids every search ever carrying `sort=best&connections=any&...`.
 */
export function writeFiltersToSearchParams(params: URLSearchParams, filters: FilterState): void {
  const setOrClear = (key: string, value: string, isDefault: boolean) => {
    if (isDefault) params.delete(key);
    else params.set(key, value);
  };

  setOrClear("sort", filters.sort, filters.sort === DEFAULT_FILTERS.sort);
  setOrClear("connections", filters.connections, filters.connections === DEFAULT_FILTERS.connections);
  setOrClear("confirmedOnly", String(filters.confirmedOnly), filters.confirmedOnly === DEFAULT_FILTERS.confirmedOnly);
  setOrClear("departure", filters.departure, filters.departure === DEFAULT_FILTERS.departure);
  setOrClear("arrival", filters.arrival, filters.arrival === DEFAULT_FILTERS.arrival);
  setOrClear("maxFare", String(filters.maxFare), filters.maxFare === DEFAULT_FILTERS.maxFare);
  setOrClear("maxDuration", String(filters.maxDuration), filters.maxDuration === DEFAULT_FILTERS.maxDuration);
  setOrClear("transport", filters.transport, filters.transport === DEFAULT_FILTERS.transport);
}
export function journeySignature(j: AnnotatedJourney): string {
  return j.legs.map((l) => `${l.trainNo || l.trainName}-${l.depAbsMin}-${l.arrAbsMin}`).join("|");
}
/** Which badge (if any) a journey card should show, relative to the rest of its result set. */
export function tagFor(journey: AnnotatedJourney, ranked: RankedResults): string | undefined {
  const sig = journeySignature(journey);

  if (ranked.cheapest && journeySignature(ranked.cheapest) === sig) return "Cheapest";
  if (ranked.fastest && journeySignature(ranked.fastest) === sig) return "Fastest";
  if (ranked.easiest && journeySignature(ranked.easiest) === sig) return "Fewest changes";
  if (ranked.mostReliable && journeySignature(ranked.mostReliable) === sig && journey.fullyConfirmed) {
    return "Most reliable";
  }
  if (journey.fullyConfirmed) return "Confirmed";
  return journey.connections === 0 ? "Direct backup" : "Backup route";
}
export const DEPARTURE_WINDOW_LABEL: Record<DepartureWindow, string> = {
  any: "Any time",
  morning: "Morning · 6am–12pm",
  afternoon: "Afternoon · 12pm–5pm",
  evening: "Evening · 5pm–9pm",
  night: "Night · 9pm–6am",
};

function departureHour(journey: AnnotatedJourney): number {
  return Math.floor((journey.legs[0].depAbsMin % 1440) / 60);
}

function arrivalHour(journey: AnnotatedJourney): number {
  const lastLeg = journey.legs[journey.legs.length - 1];
  return Math.floor((lastLeg.arrAbsMin % 1440) / 60);
}

function inWindow(hour: number, window: DepartureWindow): boolean {
  switch (window) {
    case "morning":
      return hour >= 6 && hour < 12;
    case "afternoon":
      return hour >= 12 && hour < 17;
    case "evening":
      return hour >= 17 && hour < 21;
    case "night":
      return hour >= 21 || hour < 6;
    default:
      return true;
  }
}

function matchesTransport(journey: AnnotatedJourney, transport: TransportFilter): boolean {
  if (transport === "any") return true;
  if (transport === "mixed") return journey.modesUsed.length > 1;
  return journey.modesUsed.length === 1 && journey.modesUsed[0] === transport;
}

export function applyFilters(journeys: AnnotatedJourney[], filters: FilterState): AnnotatedJourney[] {
  let out = journeys.filter((j) => {
    if (filters.connections === "direct" && j.connections !== 0) return false;
    if (filters.connections === "oneChange" && j.connections > 1) return false;
    if (filters.connections === "twoChanges" && j.connections > 2) return false;
    if (filters.connections === "threeChanges" && j.connections > 3) return false;
    if (filters.confirmedOnly && !j.fullyConfirmed) return false;
    if (filters.departure !== "any" && !inWindow(departureHour(j), filters.departure)) return false;
    if (filters.arrival !== "any" && !inWindow(arrivalHour(j), filters.arrival)) return false;
    if (filters.maxFare !== null && j.totalFare !== null && j.totalFare > filters.maxFare) return false;
    if (filters.maxDuration !== null && j.totalDurationMin > filters.maxDuration) return false;
    if (!matchesTransport(j, filters.transport)) return false;
    return true;
  });

  switch (filters.sort) {
    case "cheapest":
      out = [...out].sort((a, b) => (a.totalFare ?? Infinity) - (b.totalFare ?? Infinity));
      break;
    case "fastest":
      out = [...out].sort((a, b) => a.totalDurationMin - b.totalDurationMin);
      break;
    case "fewestChanges":
      out = [...out].sort((a, b) => a.connections - b.connections);
      break;
    default:
      // "best" - keep the server's balanced-score ordering (already sorted going in)
      break;
  }

  return out;
}

export function maxFareInSet(journeys: AnnotatedJourney[]): number {
  const fares = journeys.map((j) => j.totalFare).filter((f): f is number => f !== null);
  return fares.length > 0 ? Math.max(...fares) : 0;
}

export function maxDurationInSet(journeys: AnnotatedJourney[]): number {
  return journeys.length > 0 ? Math.max(...journeys.map((j) => j.totalDurationMin)) : 0;
}

export interface TaggedJourney {
  journey: AnnotatedJourney;
  tag: string;
}

/** Lead cards for page 1: one distinct card each for Best match / Cheapest /
 *  Fastest / Fewest changes (skipping any that are duplicates of an earlier
 *  pick), then the rest of the candidate set in the server's original
 *  order, each tagged relative to the full set. Mirrors the mapOverview
 *  curation the backend already does. */
export function buildLeadList(ranked: RankedResults): TaggedJourney[] {
  const seen = new Set<string>();
  const leads: TaggedJourney[] = [];

  const tryAdd = (journey: AnnotatedJourney | undefined | null, tag: string) => {
    if (!journey) return;
    const sig = journeySignature(journey);
    if (seen.has(sig)) return;
    seen.add(sig);
    leads.push({ journey, tag });
  };

  tryAdd(ranked.bestOverall, "Best overall");
  tryAdd(ranked.cheapest, "Cheapest");
  tryAdd(ranked.fastest, "Fastest");
  tryAdd(ranked.easiest, "Fewest changes");

  const rest = ranked.all
    .filter((j) => !seen.has(journeySignature(j)))
    .map((j) => {
      seen.add(journeySignature(j));
      return { journey: j, tag: tagFor(j, ranked) ?? "Alternative" };
    });

  return [...leads, ...rest];
}