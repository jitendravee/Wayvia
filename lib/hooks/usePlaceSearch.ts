import { useQuery } from "@tanstack/react-query";
import { useDebouncedValue } from "./useDebouncedValue";

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
 * Hook for place autocomplete using countries.dev as the sole source.
 * Features:
 * - Debounced input (300ms default)
 * - Minimum query length (2 characters)
 * - Stale request prevention (via query key and TanStack Query)
 * - Query normalization (trimmed)
 * - TanStack Query caching
 */
export const usePlaceSearch = (
  query: string,
  options: {
    limit?: number;
    debounceMs?: number;
    minLength?: number;
  } = {}
) => {
  const { limit = 8, debounceMs = 300, minLength = 2 } = options;

  // Use the existing debounced value hook
  const debouncedQuery = useDebouncedValue(query.trim(), debounceMs);

  // Only query if we have sufficient length
  const shouldQuery = debouncedQuery.length >= minLength;

  return useQuery<PlaceSuggestion[], Error>({
    queryKey: ["place-search", debouncedQuery.toLowerCase(), limit],
    queryFn: async () => {
      if (!shouldQuery) return [];

      const res = await fetch(`/api/places?q=${encodeURIComponent(debouncedQuery)}&limit=${limit}`);

      if (!res.ok) {
        // Don't throw on 4xx errors from our endpoint - return empty results
        // This prevents error states from bad input
        if (res.status >= 400 && res.status < 500) {
          return [];
        }
        throw new Error(`Place search failed (${res.status})`);
      }

      const json: PlacesApiResponse = await res.json();
      return json.results ?? [];
    },
    enabled: shouldQuery,
    // Keep previous data while loading new query (better UX)
    // Note: keepPreviousData might not be available in older versions
    // If it causes issues, we can remove it
    staleTime: 5 * 60 * 1000,
  });
};