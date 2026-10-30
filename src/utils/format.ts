/**
 * Formats a population number into human-readable compact notation (e.g., 1.43B, 45.2M).
 * Uses tabular-safe numerals.
 */
export function formatPopulation(num?: number | null): string {
  if (num === undefined || num === null || isNaN(num)) return 'N/A';
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(2)}B`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(0)}K`;
  }
  return num.toLocaleString();
}

/**
 * Formats area in square kilometers.
 */
export function formatArea(areaSqKm?: number | null): string {
  if (areaSqKm === undefined || areaSqKm === null || isNaN(areaSqKm)) return 'N/A';
  if (areaSqKm >= 1_000_000) {
    return `${(areaSqKm / 1_000_000).toFixed(2)}M km²`;
  }
  if (areaSqKm >= 1_000) {
    return `${Math.round(areaSqKm).toLocaleString()} km²`;
  }
  return `${areaSqKm.toLocaleString()} km²`;
}

/**
 * Formats USD currency values.
 */
export function formatCurrency(amount?: number | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: amount > 1000 ? 0 : 2,
  }).format(amount);
}

/**
 * Formats percentages with one decimal place.
 */
export function formatPercent(val?: number | null): string {
  if (val === undefined || val === null || isNaN(val)) return 'N/A';
  return `${val.toFixed(1)}%`;
}

/**
 * Formats life expectancy in years.
 */
export function formatYears(val?: number | null): string {
  if (val === undefined || val === null || isNaN(val)) return 'N/A';
  return `${val.toFixed(1)} yrs`;
}

/**
 * Formats an indicator value given its unit/key.
 */
export function formatIndicatorValue(val: number | null | undefined, unit: string): string {
  if (val === null || val === undefined || isNaN(val)) return 'N/A';
  if (unit === 'USD') return formatCurrency(val);
  if (unit === '%') return formatPercent(val);
  if (unit === 'years') return formatYears(val);
  if (unit === 'people') return formatPopulation(val);
  return `${val.toLocaleString()} ${unit}`;
}
