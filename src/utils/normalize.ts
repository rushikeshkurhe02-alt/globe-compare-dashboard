import { IndicatorKey, IndicatorConfig, CountryIndicatorSummary } from '../types';
import { formatIndicatorValue } from './format';

export const INDICATOR_CONFIGS: Record<IndicatorKey, IndicatorConfig> = {
  gdp_per_capita: {
    key: 'gdp_per_capita',
    code: 'NY.GDP.PCAP.CD',
    label: 'GDP per Capita',
    unit: 'USD',
    description: 'Gross Domestic Product per person in current US Dollars',
  },
  population: {
    key: 'population',
    code: 'SP.POP.TOTL',
    label: 'Population',
    unit: 'people',
    description: 'Total national population estimate',
  },
  literacy: {
    key: 'literacy',
    code: 'SE.ADT.LITR.ZS',
    label: 'Adult Literacy',
    unit: '%',
    description: 'Adult literacy rate (% of people ages 15 and above)',
  },
  life_expectancy: {
    key: 'life_expectancy',
    code: 'SP.DYN.LE00.IN',
    label: 'Life Expectancy',
    unit: 'years',
    description: 'Life expectancy at birth (total years)',
  },
  internet_users: {
    key: 'internet_users',
    code: 'IT.NET.USER.ZS',
    label: 'Internet Users',
    unit: '%',
    description: 'Individuals using the Internet (% of total population)',
  },
};

export interface RadarDataPoint {
  axis: string;
  indicatorKey: IndicatorKey;
  unit: string;
  // Normalized score (0-100) per country code: e.g. USA: 85, JPN: 100
  [countryCode: string]: number | string | any;
  // Metadata for custom tooltips
  _meta: Record<
    string,
    {
      rawValue: number | null;
      formattedValue: string;
      year: number | null;
      isNA: boolean;
      score: number;
    }
  >;
}

/**
 * Normalizes metrics across selected countries into a 0-100 relative scale
 * for radar chart visualization.
 *
 * For each indicator axis:
 * 1. Finds the maximum raw value among the selected countries.
 * 2. Normalizes each country's value: (val / maxVal) * 100.
 * 3. Keeps raw values, units, and source years in _meta for custom tooltips.
 */
export function buildNormalizedRadarData(
  countryCodes: string[],
  summaries: Record<string, Record<IndicatorKey, CountryIndicatorSummary | undefined>>
): RadarDataPoint[] {
  const keys: IndicatorKey[] = [
    'gdp_per_capita',
    'population',
    'literacy',
    'life_expectancy',
    'internet_users',
  ];

  return keys.map((key) => {
    const config = INDICATOR_CONFIGS[key];
    const dataPoint: RadarDataPoint = {
      axis: config.label,
      indicatorKey: key,
      unit: config.unit,
      _meta: {},
    };

    // Find maximum among countries
    let max = 0;
    countryCodes.forEach((code) => {
      const summary = summaries[code]?.[key];
      const val = summary?.latestValue ?? 0;
      if (val > max) max = val;
    });

    countryCodes.forEach((code) => {
      const summary = summaries[code]?.[key];
      const rawVal = summary?.latestValue ?? null;
      const year = summary?.latestYear ?? null;
      const isNA = rawVal === null || isNaN(rawVal);

      const score = isNA || max === 0 ? 0 : Math.round((rawVal / max) * 100);

      dataPoint[code] = score;
      dataPoint._meta[code] = {
        rawValue: rawVal,
        formattedValue: formatIndicatorValue(rawVal, config.unit),
        year,
        isNA,
        score,
      };
    });

    return dataPoint;
  });
}
