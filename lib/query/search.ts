import { useQuery } from '@tanstack/react-query';
import { runJourneySearch } from '@/lib/searchJourney';
import type { Mode } from '@/app/types';

export interface SearchParams {
  from: string; // Place ID
  to: string; // Place ID
  date: string;
  travelClass: string;
  quota: string;
  maxHubs: number;
  maxConnections: 1 | 2 | 3;
  modes: Mode[];
  page?: number;
  pageSize?: number;
}

export const useJourneySearch = (params: SearchParams) => {
  return useQuery({
    queryKey: ['journeySearch', params],
    queryFn: async () => {
      // Convert place IDs to resolver-friendly format for the backend
      // The backend's parseCommonParams expects raw strings that can be resolved to places
      // We'll pass the place IDs directly, and the backend's getOrCreatePlace should handle them
      const response = await runJourneySearch({
        from: params.from,
        to: params.to,
        date: params.date,
        travelClass: params.travelClass,
        quota: params.quota,
        maxHubs: params.maxHubs,
        maxConnections: params.maxConnections,
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 10,
        modes: params.modes,
      });
      return response;
    },
    // Don't auto-search - only search when manually triggered
    enabled: false,
  });
};