import { useMemo } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { CountryListItem, CountryIndicatorSummary, IndicatorKey } from '../../types';
import { buildNormalizedRadarData, RadarDataPoint } from '../../utils/normalize';
import { COMPARE_COLORS } from '../../store/useCompareStore';
import { Info } from 'lucide-react';

interface RadarCompareProps {
  countries: CountryListItem[];
  indicators: Record<string, Record<IndicatorKey, CountryIndicatorSummary>> | undefined;
  isLoading?: boolean;
}

export function RadarCompare({ countries, indicators, isLoading }: RadarCompareProps) {
  const countryCodes = useMemo(() => countries.map((c) => c.cca3), [countries]);

  const radarData: RadarDataPoint[] = useMemo(() => {
    if (!indicators) return [];
    return buildNormalizedRadarData(countryCodes, indicators);
  }, [countryCodes, indicators]);

  if (isLoading) {
    return (
      <div className="h-72 sm:h-96 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand-indigo border-t-transparent animate-spin" />
      </div>
    );
  }

  if (radarData.length === 0 || countries.length === 0) {
    return (
      <div className="h-72 sm:h-96 flex flex-col items-center justify-center text-text-muted text-sm">
        <p>No comparison data available for current selection.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Recharts Radar Chart */}
      <div className="w-full h-[300px] sm:h-80 md:h-96">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
            <PolarGrid stroke="var(--border-color)" strokeDasharray="3 3" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 500 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: 'var(--text-muted)', fontSize: 9 }}
              stroke="var(--border-subtle)"
            />

            <Tooltip content={<CustomRadarTooltip countries={countries} />} />

            {countries.map((country, idx) => {
              const color = COMPARE_COLORS[idx % COMPARE_COLORS.length];
              return (
                <Radar
                  key={country.cca3}
                  name={country.name.common}
                  dataKey={country.cca3}
                  stroke={color}
                  strokeWidth={2}
                  fill={color}
                  fillOpacity={0.25}
                  isAnimationActive={true}
                />
              );
            })}
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend below the chart as requested */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-3 pt-3 border-t border-border-subtle">
        {countries.map((country, idx) => {
          const color = COMPARE_COLORS[idx % COMPARE_COLORS.length];
          return (
            <div key={country.cca3} className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs font-semibold text-text-primary">
                {country.name.common}
              </span>
              <span className="text-[10px] font-mono text-text-muted">({country.cca3})</span>
            </div>
          );
        })}
      </div>

      {/* Explanatory footnote */}
      <div className="flex items-center justify-center gap-1.5 text-center text-[11px] text-text-muted mt-2">
        <Info className="w-3 h-3 shrink-0" />
        <span>Each axis is relative (0–100) to the highest value among selected nations.</span>
      </div>
    </div>
  );
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  countries: CountryListItem[];
}

function CustomRadarTooltip({ active, payload, countries }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const dataPoint: RadarDataPoint = payload[0]?.payload;
  if (!dataPoint) return null;

  return (
    <div className="p-3.5 rounded-xl bg-white dark:bg-[#14233D] shadow-lg border border-[#E3E7EE] dark:border-[#24365A] text-xs max-w-xs space-y-2">
      <div className="font-heading font-semibold text-text-primary text-sm border-b border-border-subtle pb-1">
        {dataPoint.axis}
      </div>

      <div className="space-y-1.5">
        {countries.map((country, idx) => {
          const color = COMPARE_COLORS[idx % COMPARE_COLORS.length];
          const meta = dataPoint._meta[country.cca3];

          return (
            <div key={country.cca3} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="text-text-secondary font-medium">{country.name.common}:</span>
              </div>

              <div className="text-right">
                {meta?.isNA ? (
                  <span className="text-amber-500 font-medium">N/A (no data)</span>
                ) : (
                  <div>
                    <span className="font-semibold text-text-primary tabular-nums">
                      {meta?.formattedValue}
                    </span>
                    {meta?.year && (
                      <span className="text-[10px] text-text-muted ml-1 font-mono">
                        ({meta.year})
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
