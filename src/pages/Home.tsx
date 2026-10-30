import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';
import { useCountries } from '../hooks/useCountries';
import { useDebounce } from '../hooks/useDebounce';
import { CountryListItem, RegionFilter, SortOption } from '../types';
import { CountryCard } from '../components/country/CountryCard';
import { FilterBar } from '../components/country/FilterBar';
import { CountryDrawer } from '../components/country/CountryDrawer';
import { CompareTray } from '../components/country/CompareTray';
import { CountryCardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { Hero } from '../components/home/Hero';
import { FlagMarqueeStrip } from '../components/home/FlagMarqueeStrip';

const BATCH_SIZE = 24;

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Sync state with URL params
  const initialSearch = searchParams.get('q') || '';
  const initialRegion = (searchParams.get('region') as RegionFilter) || 'All';
  const initialSort = (searchParams.get('sort') as SortOption) || 'name-asc';

  const [searchInput, setSearchInput] = useState(initialSearch);
  const debouncedSearch = useDebounce(searchInput, 300);

  const [selectedRegion, setSelectedRegion] = useState<RegionFilter>(initialRegion);
  const [sortOption, setSortOption] = useState<SortOption>(initialSort);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Selected country for Detail Drawer
  const [activeDrawerCountry, setActiveDrawerCountry] = useState<CountryListItem | null>(null);

  // Pagination / Infinite scroll
  const [visibleCount, setVisibleCount] = useState<number>(BATCH_SIZE);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Fetch countries
  const { data: countries = [], isLoading, isError, error, refetch } = useCountries();

  // Global "/" keyboard shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement !== searchInputRef.current &&
        !['input', 'textarea', 'select'].includes(
          document.activeElement?.tagName.toLowerCase() || ''
        )
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('q', debouncedSearch);
    if (selectedRegion !== 'All') params.set('region', selectedRegion);
    if (sortOption !== 'name-asc') params.set('sort', sortOption);
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, selectedRegion, sortOption, setSearchParams]);

  // Back to top scroll listener
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Compute dynamic counts per region
  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    countries.forEach((c) => {
      if (c.region) {
        counts[c.region] = (counts[c.region] || 0) + 1;
      }
    });
    return counts;
  }, [countries]);

  // Filter and sort countries
  const filteredAndSortedCountries = useMemo(() => {
    let result = [...countries];

    // Filter by Region
    if (selectedRegion !== 'All') {
      result = result.filter(
        (c) => c.region?.toLowerCase() === selectedRegion.toLowerCase()
      );
    }

    // Filter by Search Query
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.trim().toLowerCase();
      result = result.filter((c) => {
        const common = c.name?.common?.toLowerCase() || '';
        const official = c.name?.official?.toLowerCase() || '';
        const code = c.cca3?.toLowerCase() || '';
        const capital = c.capital ? c.capital.join(' ').toLowerCase() : '';
        return (
          common.includes(q) ||
          official.includes(q) ||
          code.includes(q) ||
          capital.includes(q)
        );
      });
    }

    // Sort with null values placed last
    result.sort((a, b) => {
      switch (sortOption) {
        case 'name-asc':
          return (a.name?.common || '').localeCompare(b.name?.common || '');
        case 'name-desc':
          return (b.name?.common || '').localeCompare(a.name?.common || '');
        case 'pop-desc': {
          if (a.population === null && b.population === null) return 0;
          if (a.population === null) return 1;
          if (b.population === null) return -1;
          return b.population - a.population;
        }
        case 'pop-asc': {
          if (a.population === null && b.population === null) return 0;
          if (a.population === null) return 1;
          if (b.population === null) return -1;
          return a.population - b.population;
        }
        case 'area-desc': {
          if (a.area === null && b.area === null) return 0;
          if (a.area === null) return 1;
          if (b.area === null) return -1;
          return b.area - a.area;
        }
        default:
          return 0;
      }
    });

    return result;
  }, [countries, selectedRegion, debouncedSearch, sortOption]);

  // Reset pagination batch when filters change
  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [debouncedSearch, selectedRegion, sortOption]);

  // Infinite scroll observer
  useEffect(() => {
    if (!loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) =>
            Math.min(prev + BATCH_SIZE, filteredAndSortedCountries.length)
          );
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [filteredAndSortedCountries.length]);

  const displayedCountries = useMemo(() => {
    return filteredAndSortedCountries.slice(0, visibleCount);
  }, [filteredAndSortedCountries, visibleCount]);

  const hasActiveFilters = Boolean(searchInput || selectedRegion !== 'All' || sortOption !== 'name-asc');

  const handleClearFilters = () => {
    setSearchInput('');
    setSelectedRegion('All');
    setSortOption('name-asc');
  };

  const handleOpenDetailByCode = (cca3: string) => {
    const target = countries.find((c) => c.cca3.toUpperCase() === cca3.toUpperCase());
    if (target) {
      setActiveDrawerCountry(target);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F7F9] dark:bg-[#0E1A2F] relative pb-28 md:pb-16">
      {/* Full-Bleed 3D Flag Pillars and Interactive 3D Globe Hero */}
      <Hero
        countries={countries}
        totalCountriesCount={countries.length}
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        searchInputRef={searchInputRef}
        onSelectCountryDrawer={setActiveDrawerCountry}
      />

      {/* Slim infinite flag marquee strip below the hero (40 flags with codes), pausing on hover */}
      <FlagMarqueeStrip
        countries={countries}
        onSelectCountry={setActiveDrawerCountry}
      />

      {/* STICKY CONTROL BAR (without duplicate search input) */}
      <FilterBar
        selectedRegion={selectedRegion}
        onRegionChange={setSelectedRegion}
        sortOption={sortOption}
        onSortChange={setSortOption}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
        totalCount={countries.length}
        filteredCount={filteredAndSortedCountries.length}
        regionCounts={regionCounts}
      />

      {/* MAIN COUNTRY GRID & LIST */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 w-full">
        {isLoading ? (
          <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <CountryCardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <ErrorState
            title="Failed to load country explorer"
            error={error}
            onRetry={() => refetch()}
          />
        ) : filteredAndSortedCountries.length === 0 ? (
          <EmptyState onClear={handleClearFilters} />
        ) : (
          <>
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6'
                  : 'flex flex-col gap-2.5 sm:gap-3'
              }
            >
              {displayedCountries.map((country) => (
                <CountryCard
                  key={country.cca3}
                  country={country}
                  onOpenDetail={setActiveDrawerCountry}
                  viewMode={viewMode}
                />
              ))}
            </div>

            {/* Infinite Scroll Anchor & Loader */}
            {visibleCount < filteredAndSortedCountries.length && (
              <div ref={loadMoreRef} className="py-10 flex justify-center items-center">
                <div className="flex items-center gap-2 text-xs text-[#7A869A]">
                  <div className="w-4 h-4 border-2 border-[#1D4ED8] border-t-transparent rounded-full animate-spin" />
                  <span>Loading more countries...</span>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Floating Compare Tray */}
      <CompareTray />

      {/* Country Detail Slide-Over Drawer */}
      <CountryDrawer
        country={activeDrawerCountry}
        isOpen={Boolean(activeDrawerCountry)}
        onClose={() => setActiveDrawerCountry(null)}
        onSelectCountryCode={handleOpenDetailByCode}
      />

      {/* Floating Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-28 md:bottom-24 right-4 sm:right-6 z-30 w-11 h-11 rounded-full bg-white dark:bg-[#14233D] border border-[#CBD3E0] dark:border-[#24365A] shadow-md text-[#0B1B34] dark:text-[#E8EDF7] hover:text-[#1D4ED8] hover:border-[#1D4ED8] transition-all duration-150 flex items-center justify-center min-h-[44px] min-w-[44px] cursor-pointer"
          aria-label="Back to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
