import { useState, useMemo } from 'react';
import { Trophy, Users, DollarSign, HeartPulse, Wifi } from 'lucide-react';
import { CountryListItem, CountryIndicatorSummary, IndicatorKey } from '../../types';
import { COMPARE_COLORS } from '../../store/useCompareStore';
import { formatPopulation, formatCurrency } from '../../utils/format';

interface ComparePillars3DProps {
  countries: CountryListItem[];
  indicators: Record<string, Record<IndicatorKey, CountryIndicatorSummary>> | undefined;
}

type MetricType = 'population' | 'gdp_per_capita' | 'life_expectancy' | 'internet_users';

const METRICS: { key: MetricType; label: string; icon: any }[] = [
  { key: 'population', label: 'Population', icon: Users },
  { key: 'gdp_per_capita', label: 'GDP per Capita', icon: DollarSign },
  { key: 'life_expectancy', label: 'Life Expectancy', icon: HeartPulse },
  { key: 'internet_users', label: 'Internet Access', icon: Wifi },
];

export function ComparePillars3D({ countries, indicators }: ComparePillars3DProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('population');

  // Compute values for selected countries
  const countryMetrics = useMemo(() => {
    return countries.map((country, idx) => {
      const code = country.cca3;
      const color = COMPARE_COLORS[idx % COMPARE_COLORS.length];
      const indMap = indicators?.[code];

      let rawValue: number | null = null;
      let displayValue = 'N/A';
      let year: number | null = null;

      if (selectedMetric === 'population') {
        rawValue = country.population || null;
        displayValue = rawValue ? formatPopulation(rawValue) : 'N/A';
      } else {
        const item = indMap?.[selectedMetric];
        if (item?.latestValue !== null && item?.latestValue !== undefined) {
          rawValue = item.latestValue;
          year = item.latestYear;
          if (selectedMetric === 'gdp_per_capita') {
            displayValue = formatCurrency(rawValue);
          } else if (selectedMetric === 'life_expectancy') {
            displayValue = `${rawValue.toFixed(1)} yrs`;
          } else if (selectedMetric === 'internet_users') {
            displayValue = `${rawValue.toFixed(1)}%`;
          }
        }
      }

      return {
        country,
        color,
        rawValue,
        displayValue,
        year,
        iso2: country.cca2.toLowerCase(),
      };
    });
  }, [countries, indicators, selectedMetric]);

  // Find highest value for winner badge and normalization
  const maxVal = useMemo(() => {
    const valid = countryMetrics.map((c) => c.rawValue).filter((v): v is number => v !== null && v > 0);
    return valid.length > 0 ? Math.max(...valid) : 1;
  }, [countryMetrics]);

  return (
    <div className="rounded-2xl border border-[#E3E7EE] dark:border-[#24365A] bg-white dark:bg-[#14233D] p-5 sm:p-7 shadow-xs space-y-6">
      {/* Header & Metric Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EDF0F5] dark:border-[#1C2D4A] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#1D4ED8] dark:text-[#6C8DF5]">
              Dynamic 3D Benchmark
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-heading font-bold text-[#0B1B34] dark:text-[#E8EDF7] mt-0.5">
            Pillar Scale Comparison
          </h3>
          <p className="text-xs text-[#46546C] dark:text-[#9AA7BD]">
            Pillar heights scale dynamically with the selected metric
          </p>
        </div>

        {/* Metric Segmented Buttons */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#F0F2F6] dark:bg-[#1B2C4B] border border-[#CBD3E0] dark:border-[#24365A] overflow-x-auto scrollbar-none self-start sm:self-auto">
          {METRICS.map((m) => {
            const Icon = m.icon;
            const isSelected = selectedMetric === m.key;
            return (
              <button
                key={m.key}
                onClick={() => setSelectedMetric(m.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer min-h-[34px] ${
                  isSelected
                    ? 'bg-[#1D4ED8] text-white font-semibold shadow-xs'
                    : 'text-[#46546C] dark:text-[#9AA7BD] hover:text-[#0B1B34] dark:hover:text-[#E8EDF7]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3D Scene Container: Generous top padding (pt-28 sm:pt-32) and overflow-visible to guarantee metric cards are 100% visible */}
      <div
        className="relative w-full min-h-[460px] sm:min-h-[500px] flex items-end justify-center px-4 pt-28 sm:pt-32 pb-8 overflow-visible rounded-xl bg-gradient-to-b from-[#F6F7F9]/60 to-[#E8EEFD]/40 dark:from-[#0E1A2F]/50 dark:to-[#14233D]"
        style={{ perspective: '1200px' }}
      >
        {/* Floor Grid lines */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(to right, #CBD3E0 1px, transparent 1px), linear-gradient(to bottom, #CBD3E0 1px, transparent 1px)',
            backgroundSize: '36px 36px',
            transform: 'rotateX(60deg) scale(2)',
            transformOrigin: 'bottom center',
          }}
        />

        {/* Pillars Row */}
        <div
          className="flex items-end justify-center gap-6 sm:gap-12 md:gap-16 w-full max-w-2xl relative z-10"
          style={{
            transformStyle: 'preserve-3d',
            transform: 'rotateX(8deg) rotateY(-8deg)',
          }}
        >
          {countryMetrics.map((item) => {
            const isWinner = item.rawValue !== null && item.rawValue === maxVal && maxVal > 0;
            const val = item.rawValue || 0;
            // Proportional height between 90px and 180px for balanced composition with floating cards
            const normRatio = maxVal > 0 ? val / maxVal : 0.5;
            const height = Math.round(90 + normRatio * 90);
            const flagUrl = `https://flagcdn.com/w320/${item.iso2}.png`;

            return (
              <div
                key={item.country.cca3}
                className="flex flex-col items-center group select-none shrink-0"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Floating Metric Badge Above Pillar: Fully visible, high contrast, never cut off */}
                <div
                  className="mb-4 text-center transition-all duration-300 flex flex-col items-center"
                  style={{ transformStyle: 'preserve-3d', transform: 'translateZ(20px)' }}
                >
                  {isWinner && (
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FBF3E0] dark:bg-[#B8892B]/25 border border-[#B8892B]/50 text-[#B8892B] dark:text-[#F3CA68] text-[11px] font-bold mb-1.5 shadow-xs animate-bounce">
                      <Trophy className="w-3 h-3" />
                      <span>Highest</span>
                    </div>
                  )}

                  <div className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#1B2C4B] border border-[#CBD3E0] dark:border-[#334B79] shadow-lg min-w-[85px] sm:min-w-[100px]">
                    <span className="font-heading font-bold text-sm sm:text-base text-[#0B1B34] dark:text-white tabular-nums block leading-snug">
                      {item.displayValue}
                    </span>
                    {item.year && (
                      <span className="text-[11px] text-[#7A869A] dark:text-[#9AA7BD] font-mono block mt-0.5">
                        ({item.year})
                      </span>
                    )}
                  </div>
                </div>

                {/* The 3D Flag Pillar Box */}
                <div
                  className="relative transition-all duration-700 ease-out"
                  style={{
                    width: 'min(86px, 20vw)',
                    height: `${height}px`,
                    transformStyle: 'preserve-3d',
                    transformOrigin: 'bottom center',
                  }}
                >
                  {/* Front Face: Flag with vertical gloss */}
                  <div
                    className="absolute inset-0 rounded-xs overflow-hidden shadow-lg border border-white/20"
                    style={{
                      backgroundImage: `url(${flagUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      transform: 'translateZ(14px)',
                    }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          'linear-gradient(to bottom, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.05) 50%, rgba(0,0,0,0.25) 100%)',
                      }}
                    />
                  </div>

                  {/* Right Face: Darkened flag facet */}
                  <div
                    className="absolute top-0 bottom-0 right-0 w-[26px] rounded-r-xs overflow-hidden origin-right"
                    style={{
                      backgroundImage: `url(${flagUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'right center',
                      filter: 'brightness(0.65) contrast(1.1)',
                      transform: 'rotateY(90deg) translateZ(1px)',
                    }}
                  />

                  {/* Top Cap: Light cap with highlight */}
                  <div
                    className="absolute top-0 left-0 right-0 h-[26px] rounded-t-xs overflow-hidden origin-top"
                    style={{
                      background: 'linear-gradient(to bottom, #FFFFFF 0%, #E3E7EE 100%)',
                      border: '1px solid rgba(255,255,255,0.8)',
                      transform: 'rotateX(90deg) translateZ(1px)',
                    }}
                  />

                  {/* Floor Contact Shadow */}
                  <div
                    className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-[120%] h-3.5 rounded-full blur-xs opacity-60 pointer-events-none"
                    style={{
                      background: 'radial-gradient(ellipse at center, rgba(11,27,52,0.5) 0%, transparent 70%)',
                      transform: 'rotateX(90deg) translateZ(-6px)',
                    }}
                  />
                </div>

                {/* Country Name & Color Tag Below Pillar */}
                <div className="mt-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-heading font-bold text-xs sm:text-sm text-[#0B1B34] dark:text-[#E8EDF7] truncate max-w-[120px]">
                      {item.country.name.common}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#7A869A]">({item.country.cca3})</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
