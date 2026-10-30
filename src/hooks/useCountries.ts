import { useQuery } from '@tanstack/react-query';
import { fetchAllCountries } from '../api/countries';
import { CountryListItem } from '../types';

export const COUNTRIES_QUERY_KEY = ['countries', 'all'];

/**
 * Hook to retrieve all countries from public open datasets.
 * Cached with staleTime of 24 hours.
 */
export function useCountries() {
  return useQuery<CountryListItem[], Error>({
    queryKey: COUNTRIES_QUERY_KEY,
    queryFn: fetchAllCountries,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 48, // 48 hours
    retry: 2,
    refetchOnWindowFocus: false,
  });
}
