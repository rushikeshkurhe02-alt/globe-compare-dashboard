import React from 'react';
import { ExternalLink, Trophy, Minus } from 'lucide-react';
import { CountryListItem, CountryDetail, CountryIndicatorSummary, IndicatorKey } from '../../types';
import { CountryFlag } from '../ui/CountryFlag';
import { COMPARE_COLORS } from '../../store/useCompareStore';
import {
  formatPopulation,
  formatArea,
  formatCurrency,
  formatYears,
  formatPercent,
} from '../../utils/format';

interface ComparisonTableProps {
  countries: CountryListItem[];
  details: Record<string, CountryDetail | undefined>;
  indicators: Record<string, Record<IndicatorKey, CountryIndicatorSummary>> | undefined;
}

interface TableRowDef {
  label: string;
  category: string;
  getValue: (
    c: CountryListItem,
    d?: CountryDetail,
    ind?: Record<IndicatorKey, CountryIndicatorSummary>
  ) => {
    display: React.ReactNode;
    numeric?: number | null;
  };
  isHigherBetter?: boolean;
}

export function ComparisonTable({ countries, details, indicators }: ComparisonTableProps) {
  const rows: TableRowDef[] = [
    {
      category: 'Geography & Demographics',
      label: 'Capital City',
      getValue: (c) => ({
        display: c.capital && c.capital.length > 0 ? c.capital.join(', ') : 'None',
      }),
    },
    {
      category: 'Geography & Demographics',
      label: 'Region / Subregion',
      getValue: (c) => ({
        display: `${c.region}${c.subregion ? ` / ${c.subregion}` : ''}`,
      }),
    },
    {
      category: 'Geography & Demographics',
      label: 'Total Population',
      isHigherBetter: true,
      getValue: (c) => ({
        display: formatPopulation(c.population),
        numeric: c.population,
      }),
    },
    {
      category: 'Geography & Demographics',
      label: 'Land Area',
      isHigherBetter: true,
      getValue: (c) => ({
        display: formatArea(c.area),
        numeric: c.area,
      }),
    },
    {
      category: 'Geography & Demographics',
      label: 'Landlocked',
      getValue: (_, d) => ({
        display: d?.landlocked === undefined ? 'N/A' : d.landlocked ? 'Yes' : 'No',
      }),
    },
    {
      category: 'Economy & Society (World Bank)',
      label: 'GDP per Capita (USD)',
      isHigherBetter: true,
      getValue: (_, __, ind) => {
        const val = ind?.gdp_per_capita?.latestValue ?? null;
        const year = ind?.gdp_per_capita?.latestYear;
        return {
          display: (
            <span>
              {formatCurrency(val)}
              {year && <span className="text-[11px] text-[#7A869A] ml-1">({year})</span>}
            </span>
          ),
          numeric: val,
        };
      },
    },
    {
      category: 'Economy & Society (World Bank)',
      label: 'Life Expectancy',
      isHigherBetter: true,
      getValue: (_, __, ind) => {
        const val = ind?.life_expectancy?.latestValue ?? null;
        const year = ind?.life_expectancy?.latestYear;
        return {
          display: (
            <span>
              {formatYears(val)}
              {year && <span className="text-[11px] text-[#7A869A] ml-1">({year})</span>}
            </span>
          ),
          numeric: val,
        };
      },
    },
    {
      category: 'Economy & Society (World Bank)',
      label: 'Internet Users (%)',
      isHigherBetter: true,
      getValue: (_, __, ind) => {
        const val = ind?.internet_users?.latestValue ?? null;
        const year = ind?.internet_users?.latestYear;
        return {
          display: (
            <span>
              {formatPercent(val)}
              {year && <span className="text-[11px] text-[#7A869A] ml-1">({year})</span>}
            </span>
          ),
          numeric: val,
        };
      },
    },
    {
      category: 'Economy & Society (World Bank)',
      label: 'Adult Literacy Rate',
      isHigherBetter: true,
      getValue: (_, __, ind) => {
        const val = ind?.literacy?.latestValue ?? null;
        const year = ind?.literacy?.latestYear;
        return {
          display: (
            <span>
              {formatPercent(val)}
              {year && <span className="text-[11px] text-[#7A869A] ml-1">({year})</span>}
            </span>
          ),
          numeric: val,
        };
      },
    },
    {
      category: 'Culture & Systems',
      label: 'Currencies',
      getValue: (_, d) => {
        if (!d?.currencies) return { display: 'N/A' };
        const text = Object.values(d.currencies)
          .map((c) => `${c.name} (${c.symbol || ''})`)
          .join(', ');
        return { display: text };
      },
    },
    {
      category: 'Culture & Systems',
      label: 'Official Languages',
      getValue: (_, d) => {
        if (!d?.languages) return { display: 'N/A' };
        return { display: Object.values(d.languages).join(', ') };
      },
    },
    {
      category: 'Culture & Systems',
      label: 'Driving Side',
      getValue: (_, d) => {
        const side = d?.car?.side;
        return { display: side ? `${side} hand` : 'Right hand' };
      },
    },
    {
      category: 'Culture & Systems',
      label: 'Timezones',
      getValue: (_, d) => {
        if (!d?.timezones || d.timezones.length === 0) return { display: 'N/A' };
        return { display: d.timezones.slice(0, 3).join(', ') };
      },
    },
    {
      category: 'Culture & Systems',
      label: 'Maps Link',
      getValue: (_, d) => {
        if (!d?.maps?.googleMaps) return { display: <Minus className="w-4 h-4 text-[#7A869A]" /> };
        return {
          display: (
            <a
              href={d.maps.googleMaps}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[#1D4ED8] dark:text-[#6C8DF5] hover:underline"
            >
              <span>Google Maps</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          ),
        };
      },
    },
  ];

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-[#E3E7EE] dark:border-[#24365A] bg-white dark:bg-[#14233D] shadow-xs scrollbar-thin">
      <table className="w-full text-left text-sm border-collapse min-w-[640px]">
        <thead>
          <tr className="border-b border-[#E3E7EE] dark:border-[#24365A] bg-[#F6F7F9] dark:bg-[#1B2C4B]">
            <th className="p-4 sm:p-5 font-heading font-semibold text-[#7A869A] text-xs uppercase tracking-wider sticky left-0 bg-[#F6F7F9] dark:bg-[#1B2C4B] z-10 w-60 border-r border-[#E3E7EE] dark:border-[#24365A]">
              Indicator / Property
            </th>
            {countries.map((country, idx) => {
              const color = COMPARE_COLORS[idx % COMPARE_COLORS.length];
              return (
                <th
                  key={country.cca3}
                  className="p-4 sm:p-5 font-heading font-semibold text-[#0B1B34] dark:text-[#E8EDF7] text-sm min-w-[180px]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-4 rounded overflow-hidden shadow-xs border border-[#CBD3E0] dark:border-[#24365A] shrink-0">
                      <CountryFlag
                        cca2={country.cca2}
                        name={country.name.common}
                        fallbackSrc={country.flags.svg || country.flags.png}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                        <span className="truncate">{country.name.common}</span>
                      </div>
                      <span className="text-[11px] font-mono font-normal text-[#7A869A]">
                        {country.cca3}
                      </span>
                    </div>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EDF0F5] dark:divide-[#1C2D4A]">
          {rows.map((row, rIdx) => {
            // Check numeric winner
            let maxNumeric = -Infinity;
            let winnerCode: string | null = null;

            if (row.isHigherBetter && countries.length > 1) {
              countries.forEach((c) => {
                const res = row.getValue(c, details[c.cca3], indicators?.[c.cca3]);
                if (res.numeric !== undefined && res.numeric !== null && res.numeric > maxNumeric) {
                  maxNumeric = res.numeric;
                  winnerCode = c.cca3;
                }
              });
            }

            const isEven = rIdx % 2 === 0;

            return (
              <tr
                key={rIdx}
                className={isEven ? 'bg-white dark:bg-[#14233D]' : 'bg-[#FBFBFC] dark:bg-[#162642]'}
              >
                <td
                  className={`p-3.5 sm:p-4 text-xs sm:text-sm font-medium text-[#46546C] dark:text-[#9AA7BD] sticky left-0 z-10 border-r border-[#EDF0F5] dark:border-[#1C2D4A] whitespace-nowrap ${
                    isEven ? 'bg-white dark:bg-[#14233D]' : 'bg-[#FBFBFC] dark:bg-[#162642]'
                  }`}
                >
                  {row.label}
                </td>

                {countries.map((country) => {
                  const res = row.getValue(
                    country,
                    details[country.cca3],
                    indicators?.[country.cca3]
                  );
                  const isWinner =
                    winnerCode === country.cca3 && maxNumeric > -Infinity && res.numeric !== null;

                  return (
                    <td
                      key={country.cca3}
                      className={`p-3.5 sm:p-4 text-xs sm:text-sm tabular-nums ${
                        isWinner
                          ? 'bg-[#FBF3E0] dark:bg-[#B8892B]/15 text-[#B8892B] dark:text-[#E5B453] font-semibold'
                          : 'text-[#0B1B34] dark:text-[#E8EDF7]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span>{res.display}</span>
                        {isWinner && (
                          <span
                            className="w-4 h-4 rounded-full bg-[#B8892B]/20 text-[#B8892B] dark:text-[#E5B453] flex items-center justify-center shrink-0"
                            title="Highest metric"
                          >
                            <Trophy className="w-2.5 h-2.5 stroke-[2.5]" />
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
