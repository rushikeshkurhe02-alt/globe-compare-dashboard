import React, { useState, useMemo, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Globe, ArrowRight } from 'lucide-react';
import { CountryListItem } from '../../types';
import { CountUp } from '../ui/CountUp';
import { FlagPillars } from './FlagPillars';

// Lazy-load Globe3D for fast initial paint
const Globe3D = lazy(() =>
  import('./Globe3D').then((m) => ({ default: m.Globe3D }))
);

interface HeroProps {
  countries: CountryListItem[];
  totalCountriesCount: number;
  searchInput: string;
  onSearchChange: (val: string) => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  onSelectCountryDrawer?: (country: CountryListItem) => void;
}

export function Hero({
  countries,
  totalCountriesCount,
  searchInput,
  onSearchChange,
  searchInputRef,
  onSelectCountryDrawer,
}: HeroProps) {
  const navigate = useNavigate();
  const [activeCountryCode, setActiveCountryCode] = useState<string | null>(null);

  // Spotlight mouse position for soft radial highlight
  const [spotlight, setSpotlight] = useState<{ x: number; y: number }>({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setSpotlight({ x, y });
  };

  // Distinct continental regions count
  const regionCount = useMemo(() => {
    const set = new Set(countries.map((c) => c.region).filter(Boolean));
    return set.size || 6;
  }, [countries]);

  // Aggregate global population
  const totalWorldPop = useMemo(() => {
    const sum = countries.reduce((acc, c) => acc + (c.population || 0), 0);
    return sum || 8000000000;
  }, [countries]);

  // Handle preset chips: resolve codes from fetched countries
  const handleLaunchBenchmark = (nameA: string, nameB: string) => {
    const findCode = (name: string, fallback: string) => {
      const match = countries.find(
        (c) =>
          c.name.common.toLowerCase() === name.toLowerCase() ||
          c.cca3.toLowerCase() === name.toLowerCase()
      );
      return match ? match.cca3 : fallback;
    };

    const codeA = findCode(nameA, 'IND');
    const codeB = findCode(nameB, 'CHN');
    navigate(`/compare?c=${codeA},${codeB}`);
  };

  const handlePillarSelect = (country: CountryListItem) => {
    onSelectCountryDrawer?.(country);
  };

  return (
    <section
      onMouseMove={handleMouseMove}
      className="relative min-h-[92dvh] flex flex-col justify-between overflow-hidden border-b border-[#E3E7EE] dark:border-[#24365A] bg-gradient-to-b from-[#EAF1FF] via-[#F4F7FC] to-[#F6F7F9] dark:from-[#0E1A2F] dark:via-[#11213D] dark:to-[#0E1A2F] transition-colors"
      aria-label="Hero Overview"
    >
      {/* 1. FAINT FINE GRID PATTERN */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.4] dark:opacity-[0.15]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #CBD3E0 1px, transparent 1px), linear-gradient(to bottom, #CBD3E0 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* 2. SOFT LIGHT BEAMS / RADIAL SPOTLIGHT */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle 600px at ${spotlight.x}% ${spotlight.y}%, rgba(29, 78, 216, 0.08), transparent 70%)`,
        }}
      />

      {/* 3. SOFT WHITE RADIAL FADE FOR WCAG AA READABILITY */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-white/70 dark:bg-[#0E1A2F]/60 rounded-full blur-3xl pointer-events-none" />

      {/* TOP & MID SECTION: Two-column layout (Text Content on Left/Center + 3D Globe on Right) */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 md:pt-18 pb-6 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 flex-1">
        {/* Left Column: Hero Typography & Search */}
        <div className="max-w-2xl text-center lg:text-left space-y-6">
          {/* Eyebrow Label */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8EEFD] dark:bg-[#1D4ED8]/20 border border-[#CBD3E0] dark:border-[#24365A] text-xs font-semibold uppercase tracking-[0.12em] text-[#1D4ED8] dark:text-[#6C8DF5]">
            <Globe className="w-3.5 h-3.5" />
            <span>World Data, Simplified</span>
          </div>

          {/* H1 Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-heading font-semibold text-[#0B1B34] dark:text-[#E8EDF7] tracking-tight leading-[1.12]">
            Compare the world's nations, with{' '}
            <span className="text-[#1D4ED8] dark:text-[#6C8DF5] relative inline-block whitespace-nowrap">
              real data
              <svg
                className="absolute -bottom-2 left-0 w-full h-3 text-[#1D4ED8] dark:text-[#6C8DF5] pointer-events-none"
                viewBox="0 0 120 12"
                fill="none"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M2,9 Q60,1 118,8"
                  stroke="currentColor"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            .
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-[#46546C] dark:text-[#9AA7BD] leading-relaxed max-w-xl mx-auto lg:mx-0">
            Explore{' '}
            <strong className="text-[#0B1B34] dark:text-[#E8EDF7] font-semibold">
              {totalCountriesCount > 0 ? `${totalCountriesCount} sovereign nations` : '250+ nations'}
            </strong>{' '}
            side by side with demographic, economic, and social indicators from{' '}
            <span className="text-[#0B1B34] dark:text-[#E8EDF7] font-medium">World Bank Open Data</span>{' '}
            and open datasets.
          </p>

          {/* The ONE Search Bar on the Explore Page */}
          <div className="relative max-w-xl mx-auto lg:mx-0 group">
            <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7A869A] group-focus-within:text-[#1D4ED8] transition-colors" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchInput}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by country, ISO code, capital, or region..."
              className="w-full h-14 pl-12 pr-14 rounded-[14px] bg-white dark:bg-[#14233D] border border-[#CBD3E0] dark:border-[#24365A] text-base text-[#0B1B34] dark:text-[#E8EDF7] placeholder:text-[#7A869A] shadow-xs hover:border-[#1D4ED8]/60 focus:border-[#1D4ED8] focus:outline-none focus:ring-4 focus:ring-[#1D4ED8]/15 transition-all"
              aria-label="Search countries"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
              <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded border border-[#E3E7EE] dark:border-[#24365A] bg-[#F0F2F6] dark:bg-[#1B2C4B] text-[11px] font-mono text-[#7A869A]">
                /
              </kbd>
            </div>
          </div>

          {/* Count-Up Stats Row: Thin dividers, no boxes */}
          <div className="flex items-center justify-center lg:justify-start gap-4 sm:gap-8 pt-1 text-center lg:text-left">
            <div>
              <div className="text-xl sm:text-2xl font-heading font-bold text-[#0B1B34] dark:text-[#E8EDF7] tabular-nums">
                {totalCountriesCount > 0 ? <CountUp end={totalCountriesCount} /> : '250'}
              </div>
              <div className="text-xs text-[#7A869A] uppercase tracking-wider font-medium mt-0.5">
                Countries
              </div>
            </div>

            <div className="w-px h-8 bg-[#CBD3E0] dark:bg-[#24365A]" />

            <div>
              <div className="text-xl sm:text-2xl font-heading font-bold text-[#0B1B34] dark:text-[#E8EDF7] tabular-nums">
                <CountUp end={regionCount} />
              </div>
              <div className="text-xs text-[#7A869A] uppercase tracking-wider font-medium mt-0.5">
                Regions
              </div>
            </div>

            <div className="w-px h-8 bg-[#CBD3E0] dark:bg-[#24365A]" />

            <div>
              <div className="text-xl sm:text-2xl font-heading font-bold text-[#0B1B34] dark:text-[#E8EDF7] tabular-nums">
                {(totalWorldPop / 1e9).toFixed(1)}B
              </div>
              <div className="text-xs text-[#7A869A] uppercase tracking-wider font-medium mt-0.5">
                World Population
              </div>
            </div>
          </div>

          {/* Try Benchmark Chips */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-1 text-xs">
            <span className="text-[#7A869A] font-medium mr-1">Benchmark:</span>
            <button
              onClick={() => handleLaunchBenchmark('India', 'China')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#14233D] border border-[#CBD3E0] dark:border-[#24365A] text-[#0B1B34] dark:text-[#E8EDF7] hover:border-[#1D4ED8] hover:text-[#1D4ED8] transition-colors shadow-2xs active:scale-97 cursor-pointer min-h-[36px]"
            >
              <span>Try: India vs China</span>
              <ArrowRight className="w-3 h-3 text-[#7A869A]" />
            </button>

            <button
              onClick={() => handleLaunchBenchmark('Germany', 'Japan')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#14233D] border border-[#CBD3E0] dark:border-[#24365A] text-[#0B1B34] dark:text-[#E8EDF7] hover:border-[#1D4ED8] hover:text-[#1D4ED8] transition-colors shadow-2xs active:scale-97 cursor-pointer min-h-[36px]"
            >
              <span>Try: Germany vs Japan</span>
              <ArrowRight className="w-3 h-3 text-[#7A869A]" />
            </button>

            <button
              onClick={() => handleLaunchBenchmark('United States', 'Brazil')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#14233D] border border-[#CBD3E0] dark:border-[#24365A] text-[#0B1B34] dark:text-[#E8EDF7] hover:border-[#1D4ED8] hover:text-[#1D4ED8] transition-colors shadow-2xs active:scale-97 cursor-pointer min-h-[36px]"
            >
              <span>Try: USA vs Brazil</span>
              <ArrowRight className="w-3 h-3 text-[#7A869A]" />
            </button>
          </div>
        </div>

        {/* Right Column: 3D Globe with light styling and drag inertia */}
        <div className="w-full max-w-[320px] sm:max-w-[420px] lg:max-w-[520px] flex items-center justify-center shrink-0">
          <Suspense
            fallback={
              <div className="w-72 sm:w-96 aspect-square rounded-full border border-[#CBD3E0] dark:border-[#24365A] bg-[#E8EEFD]/40 animate-pulse" />
            }
          >
            <Globe3D
              countries={countries}
              activeCountryCode={activeCountryCode}
              className="w-[280px] sm:w-[380px] lg:w-[480px] h-[280px] sm:h-[380px] lg:h-[480px]"
            />
          </Suspense>
        </div>
      </div>

      {/* FLOOR SECTION: Pure CSS 3D Flag Pillar Skyline */}
      <div className="relative z-10 w-full pt-4 pb-2 border-t border-[#E3E7EE]/60 dark:border-[#24365A]/40 mt-auto">
        <FlagPillars
          countries={countries}
          onSelectCountry={handlePillarSelect}
          onHoverCountry={setActiveCountryCode}
        />
      </div>
    </section>
  );
}
