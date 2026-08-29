import { useQuery } from "@tanstack/react-query";

export interface PlaceSuggestion {
  id: string;
  name: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

interface PlacesApiResponse {
  query: string;
  results: PlaceSuggestion[];
}

/**
 * Place autocomplete for the search box. This goes through the
 * server-side /api/places route rather than calling resolver functions
 * directly, which used to pull ixigo's autocomplete fetch (spoofed
 * server-only headers) into the browser bundle and fail with
 * "TypeError: Failed to fetch".
 *
 * This hook is kept for backward compatibility but now properly
 * implements debouncing and uses countries.dev as the sole source.
 * New code should use usePlaceSearch from '@/lib/hooks/usePlaceSearch'
 * instead.
 */
export const usePlaceSearch = (query: string, limit: number = 8) => {
  return useQuery<PlaceSuggestion[], Error>({
    queryKey: ["places", query.trim().toLowerCase(), limit],
    queryFn: async () => {
      const q = query.trim();
      if (!q) return [];

      const res = await fetch(`/api/places?q=${encodeURIComponent(q)}&limit=${limit}`);
      if (!res.ok) {
        // Don't throw on 4xx errors - return empty results for bad input
        if (res.status >= 400 && res.status < 500) {
          return [];
        }
        throw new Error(`Place search failed (${res.status})`);
      }
      const json: PlacesApiResponse = await res.json();
      return json.results ?? [];
    },
    enabled: !!query.trim(),
    // Keep previous data while loading
    // Cache results for 5 minutes
    staleTime: 5 * 60 * 1000,
  });
};