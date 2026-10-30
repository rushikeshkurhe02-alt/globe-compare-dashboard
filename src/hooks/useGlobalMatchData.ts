import { useQuery } from '@tanstack/react-query';
import { fetchGlobalMatchDataset } from '../api/worldbank';
import { IndicatorKey } from '../types';

export const GLOBAL_MATCH_QUERY_KEY = ['worldbank', 'global-match-dataset'];

/**
 * Hook to retrieve latest indicators for all world nations for Match scoring.
 * Cached with a 24-hour staleTime.
 */
export function useGlobalMatchData() {
  return useQuery<Record<IndicatorKey, Record<string, { value: number; year: number }>>, Error>({
    queryKey: GLOBAL_MATCH_QUERY_KEY,
    queryFn: fetchGlobalMatchDataset,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 48,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}
