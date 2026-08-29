"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type { Mode, SearchResponse } from "@/app/types";
import type {
  ConnectionFilter,
  DepartureWindow,
  FilterState,
  SortKey,
  TransportFilter,
} from "@/app/components/filters";

/**
 * Client-side params for one /api/search call — from/to/date/class/quota/
 * maxHubs/maxConnections/modes (what gets *searched*), page/pageSize
 * (presentation), and every FilterState field (what gets *shown*, applied
 * server-side before pagination — see lib/searchJourney.ts). Everything
 * here that can change the returned dataset MUST be reflected in the
 * query key below, or TanStack Query will happily serve a stale response
 * for a different filter/page from its cache.
 */
export interface SearchParams {
  from: string;
  to: string;
  date: string;
  travelClass: string;
  quota: string;
  maxHubs: number;
  maxConnections: 1 | 2 | 3;
  modes: Mode[];
  page: number;
  pageSize: number;
  sort: SortKey;
  connections: ConnectionFilter;
  confirmedOnly: boolean;
  departure: DepartureWindow;
  arrival: DepartureWindow;
  maxFare: number | null;
  maxDuration: number | null;
  transport: TransportFilter;
}

/** Builds the /api/search query string for a given params object — the one place that decides what goes over the wire, shared by every caller (this hook, and MultiLegResults' per-leg useQueries) so they can never drift apart. */
export function buildSearchQuery(params: SearchParams): URLSearchParams {
  const qs = new URLSearchParams({
    from: params.from,
    to: params.to,
    date: params.date,
    class: params.travelClass,
    quota: params.quota,
    maxHubs: String(params.maxHubs),
    maxConnections: String(params.maxConnections),
    page: String(params.page),
    pageSize: String(params.pageSize),
    modes: params.modes.join(","),
    sort: params.sort,
    connections: params.connections,
    confirmedOnly: String(params.confirmedOnly),
    departure: params.departure,
    arrival: params.arrival,
    transport: params.transport,
  });
  if (params.maxFare !== null) qs.set("maxFare", String(params.maxFare));
  if (params.maxDuration !== null) qs.set("maxDuration", String(params.maxDuration));
  return qs;
}

export async function fetchSearch(params: SearchParams): Promise<SearchResponse> {
  const res = await fetch(`/api/search?${buildSearchQuery(params)}`);
  const json: SearchResponse = await res.json();
  if (!res.ok) {
    throw new Error((json as unknown as { error?: string }).error ?? `Request failed (${res.status})`);
  }
  return json;
}

/** Merges a leg's search-breadth params with its current FilterState + page into the one flat shape /api/search and the query key both need. */
export function toSearchParams(
  base: {
    from: string;
    to: string;
    date: string;
    travelClass: string;
    quota: string;
    maxHubs: number;
    maxConnections: 1 | 2 | 3;
    modes: Mode[];
    page: number;
    pageSize: number;
  },
  filters: FilterState
): SearchParams {
  return {
    ...base,
    sort: filters.sort,
    connections: filters.connections,
    confirmedOnly: filters.confirmedOnly,
    departure: filters.departure,
    arrival: filters.arrival,
    maxFare: filters.maxFare,
    maxDuration: filters.maxDuration,
    transport: filters.transport,
  };
}

/**
 * One leg's search results, kept in sync with every param that affects the
 * server's response — search breadth (from/to/date/class/quota/maxHubs/
 * maxConnections/modes), page, and every filter. Changing ANY of these
 * produces a different queryKey, so TanStack Query treats it as a genuinely
 * different query (own cache entry, own loading state) rather than quietly
 * reusing a response for the wrong filter/page.
 *
 * `enabled` lets a leg opt out (e.g. before from/to/date are known).
 * `placeholderData: keepPreviousData` keeps the previous page's results on
 * screen (instead of flashing to a loading state) while a filter/page
 * change is in flight — this is what stands in for the old manual
 * `loading` boolean.
 */
export function useJourneySearch(params: SearchParams, enabled = true) {
  return useQuery({
    queryKey: ["journey-search", params],
    queryFn: () => fetchSearch(params),
    enabled,
    placeholderData: keepPreviousData,
  });
}
