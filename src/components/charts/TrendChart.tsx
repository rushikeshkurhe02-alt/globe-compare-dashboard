import { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { CountryListItem, CountryIndicatorSummary, IndicatorKey } from '../../types';
import { COMPARE_COLORS } from '../../store/useCompareStore';
import { INDICATOR_CONFIGS } from '../../utils/normalize';
import { formatIndicatorValue } from '../../utils/format';
import { SegmentedControl, SegmentOption } from '../ui/SegmentedControl';

interface TrendChartProps {
  countries: CountryListItem[];
  indicators: Record<string, Record<IndicatorKey, CountryIndicatorSummary>> | undefined;
  isLoading?: boolean;
}

type TrendMetricKey = 'gdp_per_capita' | 'population' | 'life_expectancy' | 'internet_users';

const TREND_METRICS: SegmentOption<TrendMetricKey>[] = [
  { value: 'gdp_per_capita', label: 'GDP per Capita' },
  { value: 'population', label: 'Population' },
  { value: 'life_expectancy', label: 'Life Expectancy' },
  { value: 'internet_users', label: 'Internet' },
];

export function TrendChart({ countries, indicators, isLoading }: TrendChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<TrendMetricKey>('gdp_per_capita');

  const config = INDICATOR_CONFIGS[selectedMetric];

  // Build merged chronological data series for 2000-2024
  const chartData = useMemo(() => {
    if (!indicators) return [];

    const yearsMap: Record<number, Record<string, number | null>> = {};
    for (let yr = 2000; yr <= 2024; yr++) {
      yearsMap[yr] = {};
    }

    countries.forEach((country) => {
      const summary = indicators[country.cca3]?.[selectedMetric];
      if (summary?.history) {
        summary.history.forEach((pt) => {
          if (yearsMap[pt.year]) {
            yearsMap[pt.year][country.cca3] = pt.value;
          }
        });
      }
    });

    return Object.entries(yearsMap).map(([yearStr, countryVals]) => ({
      year: parseInt(yearStr, 10),
      ...countryVals,
    }));
  }, [countries, indicators, selectedMetric]);

  if (isLoading) {
    return (
      <div className="h-60 sm:h-80 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand-indigo border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      {/* Top Header with Metric Segmented Control (horizontally scrollable on mobile) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-heading font-semibold text-text-primary">
            Historical Trend (2000–2024)
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">{config.description}</p>
        </div>

        <div className="overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          <SegmentedControl<TrendMetricKey>
            options={TREND_METRICS}
            value={selectedMetric}
            onChange={setSelectedMetric}
            size="sm"
          />
        </div>
      </div>

      {/* Chart container (240px on mobile, 320px+ on desktop) */}
      <div className="w-full h-60 sm:h-80 md:h-96 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="year"
              ticks={[2000, 2005, 2010, 2015, 2020, 2024]}
              tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--border-theme)' }}
            />
            <YAxis
              tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--border-theme)' }}
              tickFormatter={(v) => formatAxisValue(v, config.unit)}
              width={50}
            />
            <Tooltip
              content={
                <CustomTrendTooltip
                  countries={countries}
                  unit={config.unit}
                  metricLabel={config.label}
                />
              }
            />

            {countries.map((country, idx) => {
              const color = COMPARE_COLORS[idx % COMPARE_COLORS.length];
              return (
                <Line
                  key={country.cca3}
                  type="monotone"
                  dataKey={country.cca3}
                  name={country.name.common}
                  stroke={color}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: '#FFFFFF' }}
                  connectNulls={true}
                  isAnimationActive={true}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Metric legend note */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-2 border-t border-border-subtle text-xs">
        {countries.map((country, idx) => {
          const color = COMPARE_COLORS[idx % COMPARE_COLORS.length];
          return (
            <div key={country.cca3} className="flex items-center gap-2">
              <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="font-medium text-text-primary text-xs">{country.name.common}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatAxisValue(val: number, unit: string): string {
  if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}B`;
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(0)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
  if (unit === '%') return `${val}%`;
  return String(val);
}

interface TrendTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: number;
  countries: CountryListItem[];
  unit: string;
  metricLabel: string;
}

function CustomTrendTooltip({
  active,
  payload,
  label,
  countries,
  unit,
  metricLabel,
}: TrendTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="p-3 rounded-xl bg-white dark:bg-[#14233D] shadow-lg border border-[#E3E7EE] dark:border-[#24365A] text-xs space-y-2 min-w-[180px]">
      <div className="flex items-center justify-between border-b border-border-subtle pb-1">
        <span className="font-heading font-semibold text-text-primary text-sm">{label}</span>
        <span className="text-[11px] text-text-muted">{metricLabel}</span>
      </div>

      <div className="space-y-1">
        {countries.map((country) => {
          const color = COMPARE_COLORS[countries.findIndex((c) => c.cca3 === country.cca3) % COMPARE_COLORS.length];
          const entry = payload.find((p) => p.dataKey === country.cca3);
          const val = entry?.value;

          return (
            <div key={country.cca3} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-text-secondary">{country.name.common}:</span>
              </div>
              <span className="font-semibold text-text-primary tabular-nums">
                {val !== undefined && val !== null ? formatIndicatorValue(val, unit) : 'N/A'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
