export interface CountryName {
  common: string;
  official: string;
  nativeName?: Record<string, { official: string; common: string }>;
}

export interface CountryFlags {
  png: string;
  svg: string;
  alt?: string;
}

export interface CountryListItem {
  name: CountryName;
  cca2: string;
  cca3: string;
  flags: CountryFlags;
  region: string;
  subregion?: string;
  population: number | null;
  capital?: string[];
  area: number | null;
  latlng?: [number, number];
}

export interface CountryDetail {
  name: CountryName;
  cca2: string;
  cca3: string;
  flags: CountryFlags;
  region: string;
  subregion?: string;
  population: number | null;
  capital?: string[];
  area: number | null;
  latlng?: [number, number];
  currencies?: Record<string, { name: string; symbol?: string }>;
  languages?: Record<string, string>;
  timezones?: string[];
  borders?: string[];
  maps?: {
    googleMaps?: string;
    openStreetMaps?: string;
  };
  car?: {
    signs?: string[];
    side?: 'left' | 'right';
  };
  landlocked?: boolean;
}

export interface WorldBankResponseItem {
  indicator: { id: string; value: string };
  country: { id: string; value: string };
  countryiso3code: string;
  date: string;
  value: number | null;
  unit: string;
  obs_status: string;
  decimal: number;
}

export type WorldBankResponse = [
  {
    page: number;
    pages: number;
    per_page: number;
    total: number;
  },
  WorldBankResponseItem[] | null
];

export type IndicatorKey =
  | 'gdp_per_capita'
  | 'population'
  | 'literacy'
  | 'life_expectancy'
  | 'internet_users';

export interface IndicatorConfig {
  key: IndicatorKey;
  code: string;
  label: string;
  unit: string;
  radarMaxMultiplier?: number;
  description: string;
}

export interface CountryIndicatorSummary {
  indicatorKey: IndicatorKey;
  countryCode: string;
  latestValue: number | null;
  latestYear: number | null;
  history: { year: number; value: number }[];
}

export type SortOption =
  | 'name-asc'
  | 'name-desc'
  | 'pop-desc'
  | 'pop-asc'
  | 'area-desc';

export type RegionFilter =
  | 'All'
  | 'Africa'
  | 'Americas'
  | 'Asia'
  | 'Europe'
  | 'Oceania'
  | 'Antarctic';
