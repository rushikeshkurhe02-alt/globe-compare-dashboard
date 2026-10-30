import { IndicatorKey, CountryIndicatorSummary, WorldBankResponseItem } from '../types';
import { INDICATOR_CONFIGS } from '../utils/normalize';
import { fetchJson } from './http';

const WORLDBANK_BASE = 'https://api.worldbank.org/v2';

/**
 * Fetches indicator data for up to 3 countries over 2000:2024 from the World Bank API.
 * Example URL:
 * https://api.worldbank.org/v2/country/USA;IND;JPN/indicator/NY.GDP.PCAP.CD?format=json&date=2000:2024&per_page=500
 */
export async function fetchWorldBankIndicator(
  countryCodes: string[],
  indicatorKey: IndicatorKey
): Promise<Record<string, CountryIndicatorSummary>> {
  if (countryCodes.length === 0) return {};

  const config = INDICATOR_CONFIGS[indicatorKey];
  const formattedCodes = countryCodes.map((c) => c.trim().toUpperCase()).join(';');
  const url = `${WORLDBANK_BASE}/country/${formattedCodes}/indicator/${config.code}?format=json&date=2000:2024&per_page=500`;

  const json = await fetchJson<unknown>(url, { timeoutMs: 12000, retries: 2 });

  // Initialize return map for all requested country codes
  const result: Record<string, CountryIndicatorSummary> = {};
  countryCodes.forEach((code) => {
    const upper = code.toUpperCase();
    result[upper] = {
      indicatorKey,
      countryCode: upper,
      latestValue: null,
      latestYear: null,
      history: [],
    };
  });

  // World Bank returns [paginationMeta, dataArray]
  if (!Array.isArray(json) || json.length < 2 || !Array.isArray(json[1])) {
    return result;
  }

  const items: WorldBankResponseItem[] = json[1];

  // Group items by country code
  const itemsByCountry: Record<string, WorldBankResponseItem[]> = {};

  for (const item of items) {
    const rawCode = (item.countryiso3code || item.country?.id || '').trim().toUpperCase();
    if (!rawCode) continue;

    // Map matched country or match any requested code that starts with/matches
    const matched = countryCodes.find(
      (c) => c.toUpperCase() === rawCode || rawCode.startsWith(c.toUpperCase())
    );
    const countryKey = matched ? matched.toUpperCase() : rawCode;

    if (!itemsByCountry[countryKey]) {
      itemsByCountry[countryKey] = [];
    }
    itemsByCountry[countryKey].push(item);
  }

  // Process each country's records
  for (const code of countryCodes) {
    const upper = code.toUpperCase();
    const records = itemsByCountry[upper] || [];

    // Filter valid numeric entries
    const validRecords = records
      .filter((r) => r.value !== null && !isNaN(Number(r.value)))
      .map((r) => ({
        year: parseInt(r.date, 10),
        value: Number(r.value),
      }))
      .filter((r) => !isNaN(r.year))
      .sort((a, b) => a.year - b.year);

    // Latest non-null entry (records with the highest year)
    const latest = validRecords.length > 0 ? validRecords[validRecords.length - 1] : null;

    result[upper] = {
      indicatorKey,
      countryCode: upper,
      latestValue: latest ? latest.value : null,
      latestYear: latest ? latest.year : null,
      history: validRecords,
    };
  }

  return result;
}

/**
 * Fetches all 5 primary indicators for the given set of country codes in parallel.
 */
export async function fetchAllCountryIndicators(
  countryCodes: string[]
): Promise<Record<string, Record<IndicatorKey, CountryIndicatorSummary>>> {
  if (countryCodes.length === 0) return {};

  const keys: IndicatorKey[] = [
    'gdp_per_capita',
    'population',
    'literacy',
    'life_expectancy',
    'internet_users',
  ];

  // Run in parallel with Promise.allSettled so one indicator failure does not break the others
  const results = await Promise.allSettled(
    keys.map(async (key) => {
      const summaryByCountry = await fetchWorldBankIndicator(countryCodes, key);
      return { key, summaryByCountry };
    })
  );

  const merged: Record<string, Record<IndicatorKey, CountryIndicatorSummary>> = {};
  countryCodes.forEach((c) => {
    merged[c.toUpperCase()] = {} as Record<IndicatorKey, CountryIndicatorSummary>;
  });

  results.forEach((res) => {
    if (res.status === 'fulfilled') {
      const { key, summaryByCountry } = res.value;
      for (const [countryCode, summary] of Object.entries(summaryByCountry)) {
        if (!merged[countryCode]) merged[countryCode] = {} as any;
        merged[countryCode][key] = summary;
      }
    }
  });

  return merged;
}

/**
 * Fetches latest indicator data for ALL countries using World Bank's mrnev=1 endpoint.
 * Cached with 24h staleTime.
 */
export async function fetchAllCountriesIndicatorValues(
  indicatorCode: string
): Promise<Record<string, { value: number; year: number }>> {
  const url = `${WORLDBANK_BASE}/country/all/indicator/${indicatorCode}?format=json&mrnev=1&per_page=400`;

  const json = await fetchJson<unknown>(url, { timeoutMs: 14000, retries: 2 });
  const result: Record<string, { value: number; year: number }> = {};

  if (!Array.isArray(json) || json.length < 2 || !Array.isArray(json[1])) {
    return result;
  }

  const items: WorldBankResponseItem[] = json[1];

  for (const item of items) {
    const code = (item.countryiso3code || item.country?.id || '').trim().toUpperCase();
    if (!code || code.length !== 3) continue; // Ignore aggregates that lack 3-letter ISO code

    if (item.value !== null && !isNaN(Number(item.value))) {
      result[code] = {
        value: Number(item.value),
        year: parseInt(item.date, 10) || 2023,
      };
    }
  }

  return result;
}

/**
 * Fetches the 5 primary metrics for all world nations in parallel for the Match scorer.
 */
export async function fetchGlobalMatchDataset(): Promise<
  Record<IndicatorKey, Record<string, { value: number; year: number }>>
> {
  const keys: IndicatorKey[] = [
    'gdp_per_capita',
    'life_expectancy',
    'literacy',
    'internet_users',
    'population',
  ];

  const results = await Promise.allSettled(
    keys.map(async (key) => {
      const code = INDICATOR_CONFIGS[key].code;
      const data = await fetchAllCountriesIndicatorValues(code);
      return { key, data };
    })
  );

  const merged = {} as Record<IndicatorKey, Record<string, { value: number; year: number }>>;
  keys.forEach((k) => (merged[k] = {}));

  results.forEach((res) => {
    if (res.status === 'fulfilled') {
      merged[res.value.key] = res.value.data;
    }
  });

  return merged;
}
