import { CountryListItem, IndicatorKey } from '../types';

export interface MatchWeights {
  economy: number; // GDP per capita
  health: number; // Life expectancy
  education: number; // Literacy
  connectivity: number; // Internet usage
  population: number; // Population size
}

export interface CountryMatchScore {
  country: CountryListItem;
  finalScore: number;
  breakdown: Record<keyof MatchWeights, { raw: number | null; normalized: number; weight: number }>;
  hasPartialData: boolean;
}

export const MATCH_METRIC_MAP: Record<keyof MatchWeights, IndicatorKey> = {
  economy: 'gdp_per_capita',
  health: 'life_expectancy',
  education: 'literacy',
  connectivity: 'internet_users',
  population: 'population',
};

/**
 * Computes min-max bounds for each indicator across the candidate countries.
 */
export function computeMinMaxBounds(
  countries: CountryListItem[],
  globalData: Record<IndicatorKey, Record<string, { value: number; year: number }>>
) {
  const bounds: Record<keyof MatchWeights, { min: number; max: number }> = {
    economy: { min: Infinity, max: -Infinity },
    health: { min: Infinity, max: -Infinity },
    education: { min: Infinity, max: -Infinity },
    connectivity: { min: Infinity, max: -Infinity },
    population: { min: Infinity, max: -Infinity },
  };

  countries.forEach((country) => {
    (Object.keys(MATCH_METRIC_MAP) as (keyof MatchWeights)[]).forEach((criterion) => {
      const indKey = MATCH_METRIC_MAP[criterion];
      let val: number | null = null;

      if (criterion === 'population') {
        val = country.population || null;
      } else {
        const item = globalData[indKey]?.[country.cca3];
        val = item ? item.value : null;
      }

      if (val !== null && !isNaN(val)) {
        if (val < bounds[criterion].min) bounds[criterion].min = val;
        if (val > bounds[criterion].max) bounds[criterion].max = val;
      }
    });
  });

  return bounds;
}

/**
 * Scores and ranks all valid countries based on user slider weights.
 */
export function calculateCountryMatchScores(
  countries: CountryListItem[],
  globalData: Record<IndicatorKey, Record<string, { value: number; year: number }>>,
  weights: MatchWeights,
  selectedRegion: string = 'All'
): CountryMatchScore[] {
  const totalWeight =
    weights.economy +
    weights.health +
    weights.education +
    weights.connectivity +
    weights.population;

  if (totalWeight === 0) {
    return [];
  }

  // Filter out non-sovereign or region filtered
  let candidates = countries;
  if (selectedRegion !== 'All') {
    candidates = candidates.filter(
      (c) => c.region?.toLowerCase() === selectedRegion.toLowerCase()
    );
  }

  const bounds = computeMinMaxBounds(candidates, globalData);

  const scored: CountryMatchScore[] = [];

  for (const country of candidates) {
    let weightedSum = 0;
    let activeWeightTotal = 0;
    let hasPartial = false;

    const breakdown = {} as CountryMatchScore['breakdown'];

    (Object.keys(MATCH_METRIC_MAP) as (keyof MatchWeights)[]).forEach((criterion) => {
      const weight = weights[criterion];
      const indKey = MATCH_METRIC_MAP[criterion];

      let rawVal: number | null = null;
      if (criterion === 'population') {
        rawVal = country.population || null;
      } else {
        const item = globalData[indKey]?.[country.cca3];
        rawVal = item ? item.value : null;
      }

      const b = bounds[criterion];
      let normalized = 0;

      if (rawVal !== null && !isNaN(rawVal) && b.max > b.min) {
        normalized = ((rawVal - b.min) / (b.max - b.min)) * 100;
        normalized = Math.max(0, Math.min(100, normalized));
      } else if (weight > 0) {
        hasPartial = true;
      }

      breakdown[criterion] = {
        raw: rawVal,
        normalized: Math.round(normalized),
        weight,
      };

      if (weight > 0 && rawVal !== null) {
        weightedSum += normalized * weight;
        activeWeightTotal += weight;
      }
    });

    if (activeWeightTotal > 0) {
      const finalScore = Math.round((weightedSum / activeWeightTotal) * 10) / 10;
      scored.push({
        country,
        finalScore,
        breakdown,
        hasPartialData: hasPartial,
      });
    }
  }

  // Sort descending by finalScore, then by population
  scored.sort((a, b) => {
    if (b.finalScore !== a.finalScore) {
      return b.finalScore - a.finalScore;
    }
    return (b.country.population || 0) - (a.country.population || 0);
  });

  return scored;
}
