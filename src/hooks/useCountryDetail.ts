import { useQuery } from '@tanstack/react-query';
import { fetchCountryDetail } from '../api/countries';
import { CountryDetail } from '../types';

export const COUNTRY_DETAIL_KEY = (cca3: string) => ['country', 'detail', cca3.toUpperCase()];

/**
 * Hook to retrieve deep facts and details for a country by cca3 code.
 */
export function useCountryDetail(cca3?: string | null) {
  const upperCode = cca3 ? cca3.trim().toUpperCase() : '';

  return useQuery<CountryDetail, Error>({
    queryKey: COUNTRY_DETAIL_KEY(upperCode),
    queryFn: () => fetchCountryDetail(upperCode),
    enabled: Boolean(upperCode && upperCode.length >= 2),
    staleTime: 1000 * 60 * 30, // 30 minutes
    retry: 2,
  });
}
