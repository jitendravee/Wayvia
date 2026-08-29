"use client";

import { useQuery } from "@tanstack/react-query";

export interface PlaceQueryResult {
  id: string;
  name: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

interface PlacesApiResponse {
  query: string;
  results: PlaceQueryResult[];
}

/**
 * Place autocomplete for the search box. This MUST go through the
 * server-side /api/places route rather than calling `getOrCreatePlace`
 * directly — that chain ends in `ixigoAutocomplete` (lib/providers/ixigo/
 * client.ts), which fetches ixigo.com with spoofed Referer/Origin headers
 * that only make sense coming from a server. Calling it straight from a
 * client component (as this hook used to) bundles that server code into
 * the browser and the fetch fails outright — ixigo's endpoint has no CORS
 * allow-origin for arbitrary sites, so the browser blocks it before the
 * request even leaves ("TypeError: Failed to fetch").
 */
export const usePlaceSearch = (query: string, limit: number = 8) => {
  return useQuery<PlaceQueryResult[], Error>({
    queryKey: ["places", query, limit],
    queryFn: async () => {
      const q = query.trim();
      if (!q) return [];

      const res = await fetch(`/api/places?q=${encodeURIComponent(q)}&limit=${limit}`);
      if (!res.ok) {
        throw new Error(`Place search failed (${res.status})`);
      }
      const json: PlacesApiResponse = await res.json();
      return json.results ?? [];
    },
    enabled: !!query.trim(),
  });
};
