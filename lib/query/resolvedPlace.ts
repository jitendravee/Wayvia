import { useQuery } from '@tanstack/react-query';
import { getOrCreatePlace } from '@/lib/places/repository';

export interface ResolvedPlace {
  id: string;
  name: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export const useResolvedPlace = (query: string) => {
  return useQuery<ResolvedPlace | null, Error>({
    queryKey: ['resolvedPlace', query],
    queryFn: async () => {
      if (!query.trim()) {
        return null;
      }

      const place = await getOrCreatePlace(query);
      if (!place) {
        return null;
      }

      return {
        id: place.id,
        name: place.name,
        state: place.state,
        country: place.country,
        latitude: place.latitude,
        longitude: place.longitude
      };
    },
    enabled: !!query.trim(),
  });
};