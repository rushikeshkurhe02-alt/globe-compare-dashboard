import { Trophy, Users, Maximize2, DollarSign, HeartPulse } from 'lucide-react';
import { CountryListItem, CountryIndicatorSummary, IndicatorKey } from '../../types';
import { COMPARE_COLORS } from '../../store/useCompareStore';
import { formatPopulation, formatArea, formatCurrency, formatYears } from '../../utils/format';

interface KeyStatsGridProps {
  countries: CountryListItem[];
  indicators: Record<string, Record<IndicatorKey, CountryIndicatorSummary>> | undefined;
}

interface StatDef {
  key: string;
  title: string;
  icon: typeof Users;
  getValue: (country: CountryListItem, summary?: Record<IndicatorKey, CountryIndicatorSummary>) => number | null;
  format: (val: number | null) => string;
}

export function KeyStatsGrid({ countries, indicators }: KeyStatsGridProps) {
  const stats: StatDef[] = [
    {
      key: 'population',
      title: 'Population',
      icon: Users,
      getValue: (country) => country.population,
      format: (val) => formatPopulation(val),
    },
    {
      key: 'area',
      title: 'Total Land Area',
      icon: Maximize2,
      getValue: (country) => country.area,
      format: (val) => formatArea(val),
    },
    {
      key: 'gdp',
      title: 'GDP per Capita',
      icon: DollarSign,
      getValue: (country, summary) => summary?.gdp_per_capita?.latestValue ?? null,
      format: (val) => formatCurrency(val),
    },
    {
      key: 'life_expectancy',
      title: 'Life Expectancy',
      icon: HeartPulse,
      getValue: (country, summary) => summary?.life_expectancy?.latestValue ?? null,
      format: (val) => formatYears(val),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;

        // Find the country with the highest value
        let highestCode: string | null = null;
        let maxVal = -Infinity;

        countries.forEach((country) => {
          const val = stat.getValue(country, indicators?.[country.cca3]);
          if (val !== null && val > maxVal) {
            maxVal = val;
            highestCode = country.cca3;
          }
        });

        return (
          <div
            key={stat.key}
            className="p-5 rounded-2xl border border-[#E3E7EE] dark:border-[#24365A] bg-white dark:bg-[#14233D] flex flex-col justify-between shadow-xs transition-colors"
          >
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="text-xs font-semibold text-[#7A869A] uppercase tracking-wider">
                {stat.title}
              </span>
              <div className="w-7 h-7 rounded-lg bg-[#F0F2F6] dark:bg-[#1B2C4B] flex items-center justify-center text-[#7A869A]">
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-3">
              {countries.map((country, idx) => {
                const color = COMPARE_COLORS[idx % COMPARE_COLORS.length];
                const rawVal = stat.getValue(country, indicators?.[country.cca3]);
                const isWinner = highestCode === country.cca3 && countries.length > 1 && rawVal !== null;

                return (
                  <div
                    key={country.cca3}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-[#46546C] dark:text-[#9AA7BD] truncate text-xs sm:text-sm font-medium">
                        {country.name.common}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`font-heading font-semibold tabular-nums text-sm ${
                          isWinner ? 'text-[#B8892B] dark:text-[#E5B453] font-bold' : 'text-[#0B1B34] dark:text-[#E8EDF7]'
                        }`}
                      >
                        {stat.format(rawVal)}
                      </span>

                      {isWinner && (
                        <span
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#FBF3E0] dark:bg-[#B8892B]/20 text-[#B8892B] dark:text-[#E5B453] text-[10px] font-semibold border border-[#B8892B]/30"
                          title="Highest value among compared countries"
                        >
                          <Trophy className="w-2.5 h-2.5 shrink-0" />
                          <span>Highest</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
