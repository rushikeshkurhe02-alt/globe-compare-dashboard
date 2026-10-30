import { useQuery } from '@tanstack/react-query';
import { fetchAllCountryIndicators } from '../api/worldbank';
import { CountryIndicatorSummary, IndicatorKey } from '../types';

export const INDICATORS_QUERY_KEY = (countryCodes: string[]) => [
  'worldbank',
  'indicators',
  ...[...countryCodes].sort(),
];

/**
 * Hook to retrieve World Bank indicators for 1-3 selected countries.
 */
export function useIndicators(countryCodes: string[]) {
  const normalizedCodes = countryCodes
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean)
    .sort();

  return useQuery<Record<string, Record<IndicatorKey, CountryIndicatorSummary>>, Error>({
    queryKey: INDICATORS_QUERY_KEY(normalizedCodes),
    queryFn: () => fetchAllCountryIndicators(normalizedCodes),
    enabled: normalizedCodes.length > 0,
    staleTime: 1000 * 60 * 15, // 15 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
}
