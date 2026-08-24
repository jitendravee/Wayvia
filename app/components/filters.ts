import type { AnnotatedJourney } from "../types";

export type SortKey = "best" | "cheapest" | "fastest" | "fewestChanges";
export type ConnectionFilter = "any" | "direct" | "oneChange" | "twoChanges" | "threeChanges";
export type DepartureWindow = "any" | "morning" | "afternoon" | "evening" | "night";

export interface FilterState {
  sort: SortKey;
  connections: ConnectionFilter;
  confirmedOnly: boolean;
  departure: DepartureWindow;
  maxFare: number | null; // null = no cap
}

export const DEFAULT_FILTERS: FilterState = {
  sort: "best",
  connections: "any",
  confirmedOnly: false,
  departure: "any",
  maxFare: null,
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

export function applyFilters(journeys: AnnotatedJourney[], filters: FilterState): AnnotatedJourney[] {
  let out = journeys.filter((j) => {
    if (filters.connections === "direct" && j.connections !== 0) return false;
    if (filters.connections === "oneChange" && j.connections > 1) return false;
    if (filters.connections === "twoChanges" && j.connections > 2) return false;
    if (filters.connections === "threeChanges" && j.connections > 3) return false;
    if (filters.confirmedOnly && !j.fullyConfirmed) return false;
    if (filters.departure !== "any" && !inWindow(departureHour(j), filters.departure)) return false;
    if (filters.maxFare !== null && j.totalFare !== null && j.totalFare > filters.maxFare) return false;
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