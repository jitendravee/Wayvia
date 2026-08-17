import type { AnnotatedJourney } from "../types";

export type SortKey = "best" | "cheapest" | "fastest" | "fewestChanges";
export type ConnectionFilter = "any" | "direct" | "oneChange";
export type DepartureWindow = "any" | "early" | "morning" | "afternoon" | "night";

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

function departureHour(journey: AnnotatedJourney): number {
  return Math.floor((journey.legs[0].depAbsMin % 1440) / 60);
}

function inWindow(hour: number, window: DepartureWindow): boolean {
  switch (window) {
    case "early":
      return hour >= 0 && hour < 6;
    case "morning":
      return hour >= 6 && hour < 12;
    case "afternoon":
      return hour >= 12 && hour < 18;
    case "night":
      return hour >= 18 && hour < 24;
    default:
      return true;
  }
}

export function applyFilters(journeys: AnnotatedJourney[], filters: FilterState): AnnotatedJourney[] {
  let out = journeys.filter((j) => {
    if (filters.connections === "direct" && j.connections !== 0) return false;
    if (filters.connections === "oneChange" && j.connections > 1) return false;
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
