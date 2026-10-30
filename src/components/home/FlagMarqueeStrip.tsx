import React from 'react';
import { CountryListItem } from '../../types';

interface FlagMarqueeStripProps {
  countries: CountryListItem[];
  onSelectCountry?: (country: CountryListItem) => void;
}

export function FlagMarqueeStrip({ countries, onSelectCountry }: FlagMarqueeStripProps) {
  // Take 40 countries with valid population/area
  const items = React.useMemo(() => {
    if (!countries.length) return [];
    return [...countries]
      .filter((c) => c.population && c.population > 0)
      .slice(0, 40)
      .map((c) => ({
        country: c,
        cca2: c.cca2.toLowerCase(),
        cca3: c.cca3,
        name: c.name.common,
        flagUrl: `https://flagcdn.com/w80/${c.cca2.toLowerCase()}.png`,
      }));
  }, [countries]);

  if (items.length === 0) return null;

  return (
    <div
      className="w-full border-y border-[#E3E7EE] dark:border-[#24365A] bg-white dark:bg-[#14233D] py-2.5 overflow-hidden select-none group"
      aria-label="World nations flag ticker"
    >
      <div className="flex w-max animate-marquee-left group-hover:[animation-play-state:paused]">
        {/* Set 1 */}
        <div className="flex items-center gap-4 sm:gap-6 pr-4 sm:pr-6 shrink-0">
          {items.map((item) => (
            <button
              key={`m1-${item.cca3}`}
              onClick={() => onSelectCountry?.(item.country)}
              className="flex items-center gap-2 px-2.5 py-1 rounded-lg hover:bg-[#F0F2F6] dark:hover:bg-[#1B2C4B] transition-colors cursor-pointer text-left shrink-0"
              title={`${item.name} (${item.cca3})`}
            >
              <img
                src={item.flagUrl}
                alt=""
                className="w-5 h-3.5 rounded-xs object-cover border border-slate-200 dark:border-white/20 shadow-2xs"
                loading="lazy"
              />
              <span className="text-xs font-mono font-semibold text-[#0B1B34] dark:text-[#E8EDF7]">
                {item.cca3}
              </span>
              <span className="text-xs text-[#7A869A] font-medium hidden sm:inline truncate max-w-[90px]">
                {item.name}
              </span>
            </button>
          ))}
        </div>

        {/* Set 2 (for seamless loop) */}
        <div className="flex items-center gap-4 sm:gap-6 pr-4 sm:pr-6 shrink-0" aria-hidden="true">
          {items.map((item) => (
            <button
              key={`m2-${item.cca3}`}
              onClick={() => onSelectCountry?.(item.country)}
              tabIndex={-1}
              className="flex items-center gap-2 px-2.5 py-1 rounded-lg hover:bg-[#F0F2F6] dark:hover:bg-[#1B2C4B] transition-colors cursor-pointer text-left shrink-0"
            >
              <img
                src={item.flagUrl}
                alt=""
                className="w-5 h-3.5 rounded-xs object-cover border border-slate-200 dark:border-white/20 shadow-2xs"
                loading="lazy"
              />
              <span className="text-xs font-mono font-semibold text-[#0B1B34] dark:text-[#E8EDF7]">
                {item.cca3}
              </span>
              <span className="text-xs text-[#7A869A] font-medium hidden sm:inline truncate max-w-[90px]">
                {item.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
