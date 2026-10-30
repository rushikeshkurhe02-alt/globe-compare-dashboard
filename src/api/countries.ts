import { CountryListItem, CountryDetail } from '../types';
import { fetchJson } from './http';

const WORLDBANK_COUNTRIES_URL =
  'https://api.worldbank.org/v2/country?format=json&per_page=300';
const WORLDBANK_POP_URL =
  'https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&mrnev=1&per_page=400';
const WORLDBANK_AREA_URL =
  'https://api.worldbank.org/v2/country/all/indicator/AG.SRF.TOTL.K2?format=json&mrnev=1&per_page=400';
const MLEDOZE_DATASET_URL =
  'https://cdn.jsdelivr.net/gh/mledoze/countries@master/dist/countries.json';

interface MledozeCountry {
  name: {
    common: string;
    official: string;
    native?: Record<string, { official: string; common: string }>;
  };
  cca2: string;
  cca3: string;
  capital?: string[];
  region: string;
  subregion?: string;
  languages?: Record<string, string>;
  currencies?: Record<string, { name: string; symbol?: string }>;
  borders?: string[];
  area?: number;
  landlocked?: boolean;
  timezones?: string[];
  latlng?: [number, number];
  car?: { side?: 'left' | 'right'; signs?: string[] };
}

interface WorldBankCountryItem {
  id: string; // ISO3
  iso2Code: string;
  name: string;
  region: { id: string; value: string };
  capitalCity: string;
  longitude?: string;
  latitude?: string;
}

interface IndicatorItem {
  countryiso3code: string;
  value: number | null;
}

function normalizeRegion(rawRegion: string | undefined): string {
  if (!rawRegion) return 'Other';
  const r = rawRegion.trim().toLowerCase();
  if (r.includes('antarct') || r.includes('polar')) return 'Antarctic';
  if (r.includes('americ') || r.includes('caribbean')) return 'Americas';
  if (r.includes('asia') || r.includes('middle east')) return 'Asia';
  if (r.includes('europ')) return 'Europe';
  if (r.includes('africa')) return 'Africa';
  if (r.includes('oceania') || r.includes('pacific')) return 'Oceania';
  return rawRegion;
}

function buildFlags(cca2: string, commonName: string) {
  const code = (cca2 || '').toLowerCase();
  return {
    png: `https://flagcdn.com/w320/${code}.png`,
    svg: `https://flagcdn.com/${code}.svg`,
    alt: `Flag of ${commonName}`,
  };
}

// Module-level cached promise to download dataset only once
let sharedCountriesPromise: Promise<{
  list: CountryListItem[];
  detailsMap: Map<string, CountryDetail>;
}> | null = null;

async function loadCountriesDataset(): Promise<{
  list: CountryListItem[];
  detailsMap: Map<string, CountryDetail>;
}> {
  // Query World Bank country list, population, surface area, and mledoze dataset in parallel
  const [wbCountriesRes, popRes, areaRes, mledozeRes] = await Promise.allSettled([
    fetchJson<[any, WorldBankCountryItem[]]>(WORLDBANK_COUNTRIES_URL),
    fetchJson<[any, IndicatorItem[]]>(WORLDBANK_POP_URL),
    fetchJson<[any, IndicatorItem[]]>(WORLDBANK_AREA_URL),
    fetchJson<MledozeCountry[]>(MLEDOZE_DATASET_URL),
  ]);

  const hasMledoze = mledozeRes.status === 'fulfilled' && Array.isArray(mledozeRes.value) && mledozeRes.value.length > 0;
  const hasWbCountries = wbCountriesRes.status === 'fulfilled' && Array.isArray(wbCountriesRes.value) && Array.isArray(wbCountriesRes.value[1]);

  // If BOTH primary sources failed, throw an error to trigger ErrorState
  if (!hasMledoze && !hasWbCountries) {
    throw new Error('No data received from public country registries.');
  }

  // Build Population Map from World Bank
  const popMap = new Map<string, number | null>();
  if (popRes.status === 'fulfilled' && Array.isArray(popRes.value) && Array.isArray(popRes.value[1])) {
    for (const item of popRes.value[1]) {
      const code = (item.countryiso3code || '').trim().toUpperCase();
      if (code && code.length === 3) {
        popMap.set(code, item.value !== null && !isNaN(Number(item.value)) ? Number(item.value) : null);
      }
    }
  }

  // Build Area Map from World Bank
  const wbAreaMap = new Map<string, number | null>();
  if (areaRes.status === 'fulfilled' && Array.isArray(areaRes.value) && Array.isArray(areaRes.value[1])) {
    for (const item of areaRes.value[1]) {
      const code = (item.countryiso3code || '').trim().toUpperCase();
      if (code && code.length === 3) {
        wbAreaMap.set(code, item.value !== null && !isNaN(Number(item.value)) ? Number(item.value) : null);
      }
    }
  }

  const list: CountryListItem[] = [];
  const detailsMap = new Map<string, CountryDetail>();

  if (hasMledoze) {
    const mledozeList = mledozeRes.value;

    for (const mc of mledozeList) {
      const cca3 = (mc.cca3 || '').trim().toUpperCase();
      const cca2 = (mc.cca2 || '').trim().toUpperCase();
      const commonName = mc.name?.common?.trim();

      if (!cca3 || !commonName) continue;

      const wbPop = popMap.get(cca3);
      const population = wbPop !== undefined ? wbPop : null;

      // Area priority: mledoze area with World Bank as backup
      let area: number | null = null;
      if (typeof mc.area === 'number' && !isNaN(mc.area) && mc.area > 0) {
        area = mc.area;
      } else {
        const wbArea = wbAreaMap.get(cca3);
        area = wbArea !== undefined ? wbArea : null;
      }

      const region = normalizeRegion(mc.region);
      const flags = buildFlags(cca2, commonName);
      const capital = Array.isArray(mc.capital) ? mc.capital : [];

      const listItem: CountryListItem = {
        name: {
          common: commonName,
          official: mc.name?.official || commonName,
          nativeName: mc.name?.native,
        },
        cca2,
        cca3,
        flags,
        region,
        subregion: mc.subregion || region,
        population,
        capital,
        area,
        latlng: Array.isArray(mc.latlng) && mc.latlng.length >= 2 ? [mc.latlng[0], mc.latlng[1]] : undefined,
      };

      list.push(listItem);

      const detailItem: CountryDetail = {
        ...listItem,
        currencies: mc.currencies,
        languages: mc.languages,
        timezones: mc.timezones,
        borders: mc.borders,
        maps: {
          googleMaps: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(commonName)}`,
        },
        car: mc.car ? { signs: mc.car.signs, side: mc.car.side === 'left' ? 'left' : 'right' } : undefined,
        landlocked: mc.landlocked,
      };

      detailsMap.set(cca3, detailItem);
    }
  } else if (hasWbCountries) {
    // Fallback: build dataset from World Bank country list
    const wbItems = wbCountriesRes.value[1];

    for (const item of wbItems) {
      if (item.region?.value === 'Aggregates') continue;

      const cca3 = (item.id || '').trim().toUpperCase();
      const cca2 = (item.iso2Code || '').trim().toUpperCase();
      const commonName = (item.name || '').trim();

      if (!cca3 || cca3.length !== 3 || !commonName) continue;

      const wbPop = popMap.get(cca3);
      const population = wbPop !== undefined ? wbPop : null;

      const wbArea = wbAreaMap.get(cca3);
      const area = wbArea !== undefined ? wbArea : null;

      const region = normalizeRegion(item.region?.value);
      const flags = buildFlags(cca2, commonName);
      const capital = item.capitalCity ? [item.capitalCity] : [];

      const listItem: CountryListItem = {
        name: {
          common: commonName,
          official: commonName,
        },
        cca2,
        cca3,
        flags,
        region,
        subregion: region,
        population,
        capital,
        area,
        latlng: item.latitude && item.longitude ? [parseFloat(item.latitude), parseFloat(item.longitude)] : undefined,
      };

      list.push(listItem);

      const detailItem: CountryDetail = {
        ...listItem,
        maps: {
          googleMaps: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(commonName)}`,
        },
      };

      detailsMap.set(cca3, detailItem);
    }
  }

  // Validate non-empty result
  if (list.length === 0) {
    throw new Error('No data received from country data sources.');
  }

  return { list, detailsMap };
}

/**
 * Fetches all world countries merged from World Bank and mledoze open data.
 * Caches in-memory so network requests happen only once.
 */
export async function fetchAllCountries(): Promise<CountryListItem[]> {
  if (!sharedCountriesPromise) {
    sharedCountriesPromise = loadCountriesDataset().catch((err) => {
      // Reset on failure so subsequent retries can refetch
      sharedCountriesPromise = null;
      throw err;
    });
  }

  const { list } = await sharedCountriesPromise;
  return list;
}

/**
 * Fetches country detailed profile from the shared dataset.
 * Resolves without additional network requests.
 */
export async function fetchCountryDetail(cca3: string): Promise<CountryDetail> {
  const cleanCode = (cca3 || '').trim().toUpperCase();

  if (!sharedCountriesPromise) {
    sharedCountriesPromise = loadCountriesDataset().catch((err) => {
      sharedCountriesPromise = null;
      throw err;
    });
  }

  const { detailsMap, list } = await sharedCountriesPromise;
  const found = detailsMap.get(cleanCode);

  if (found) {
    return found;
  }

  // Fallback if detail not in map but in list
  const inList = list.find((c) => c.cca3 === cleanCode);
  if (inList) {
    return {
      ...inList,
      maps: {
        googleMaps: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(inList.name.common)}`,
      },
    };
  }

  throw new Error(`Country ${cca3} not found`);
}
