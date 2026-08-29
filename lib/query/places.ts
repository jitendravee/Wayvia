import { useQuery } from '@tanstack/react-query';
import { getOrCreatePlace } from '@/lib/places/repository';

export interface PlaceQueryResult {
  id: string;
  name: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export const usePlaceSearch = (query: string, limit: number = 8) => {
  return useQuery<PlaceQueryResult[], Error>({
    queryKey: ['places', query, limit],
    queryFn: async () => {
      if (!query.trim()) {
        return [];
      }

      const place = await getOrCreatePlace(query);
      if (!place) {
        return [];
      }

      // Return in the format expected by the frontend
      return [{
        id: place.id,
        name: place.name,
        state: place.state,
        country: place.country,
        latitude: place.latitude,
        longitude: place.longitude
      }];
    },
    enabled: !!query.trim(),
  });
};