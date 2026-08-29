"use client";

import { useQuery } from "@tanstack/react-query";

export interface ResolvedPlace {
  id: string;
  name: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

interface PlacesApiResponse {
  query: string;
  results: ResolvedPlace[];
}

/**
 * Resolves a single Place (e.g. to show "Pune, Maharashtra" under a Place
 * ID already picked). Same fix as usePlaceSearch (lib/query/places.ts):
 * goes through the server-side /api/places route instead of calling
 * `getOrCreatePlace` directly, which used to pull ixigo's autocomplete
 * fetch (spoofed server-only headers) into the browser bundle and fail
 * with "TypeError: Failed to fetch" on every call.
 */
export const useResolvedPlace = (query: string) => {
  return useQuery<ResolvedPlace | null, Error>({
    queryKey: ["resolvedPlace", query],
    queryFn: async () => {
      const q = query.trim();
      if (!q) return null;

      const res = await fetch(`/api/places?q=${encodeURIComponent(q)}&limit=1`);
      if (!res.ok) {
        throw new Error(`Place resolve failed (${res.status})`);
      }
      const json: PlacesApiResponse = await res.json();
      return json.results?.[0] ?? null;
    },
    enabled: !!query.trim(),
  });
};
