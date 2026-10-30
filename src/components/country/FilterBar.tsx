import React, { useState, useRef, useEffect } from 'react';
import { LayoutGrid, List, RotateCcw, ArrowUpDown, X, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RegionFilter, SortOption } from '../../types';

interface FilterBarProps {
  selectedRegion: RegionFilter;
  onRegionChange: (region: RegionFilter) => void;
  sortOption: SortOption;
  onSortChange: (sort: SortOption) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  totalCount: number;
  filteredCount: number;
  regionCounts?: Record<string, number>;
}

const REGIONS: RegionFilter[] = [
  'All',
  'Africa',
  'Americas',
  'Asia',
  'Europe',
  'Oceania',
  'Antarctic',
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'name-asc', label: 'Name (A–Z)' },
  { value: 'name-desc', label: 'Name (Z–A)' },
  { value: 'pop-desc', label: 'Population (High–Low)' },
  { value: 'pop-asc', label: 'Population (Low–High)' },
  { value: 'area-desc', label: 'Area (Large–Small)' },
];

export function FilterBar({
  selectedRegion,
  onRegionChange,
  sortOption,
  onSortChange,
  viewMode,
  onViewModeChange,
  onClearFilters,
  hasActiveFilters,
  totalCount,
  filteredCount,
  regionCounts = {},
}: FilterBarProps) {
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);
  const [isStuck, setIsStuck] = useState(false);
  const barRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!barRef.current) return;
      const rect = barRef.current.getBoundingClientRect();
      setIsStuck(rect.top <= 65);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      ref={barRef}
      className={`sticky top-16 z-30 w-full bg-white dark:bg-[#14233D] border-b border-[#E3E7EE] dark:border-[#24365A] py-3 transition-shadow duration-200 ${
        isStuck ? 'shadow-md shadow-slate-900/5 dark:shadow-black/20' : 'shadow-none'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Region Pills with Dynamic Count Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto snap-x snap-mandatory pb-1 md:pb-0 scrollbar-none">
          {REGIONS.map((region) => {
            const isSelected = selectedRegion === region;
            const count = region === 'All' ? totalCount : regionCounts[region] ?? 0;

            return (
              <button
                key={region}
                onClick={() => onRegionChange(region)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 snap-start transition-all flex items-center gap-1.5 min-h-[36px] cursor-pointer ${
                  isSelected
                    ? 'bg-[#1D4ED8] text-white font-semibold shadow-xs'
                    : 'bg-[#F0F2F6] dark:bg-[#1B2C4B] hover:bg-[#E8EEFD] dark:hover:bg-[#24365A] text-[#46546C] dark:text-[#9AA7BD] hover:text-[#0B1B34] dark:hover:text-white border border-[#E3E7EE] dark:border-[#24365A]'
                }`}
              >
                <span>{region}</span>
                {count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono tabular-nums ${
                      isSelected
                        ? 'bg-white/25 text-white font-bold'
                        : 'bg-black/5 dark:bg-white/10 text-[#7A869A] dark:text-[#9AA7BD]'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right: Controls (Sort Select + View Toggle + Results Count + Clear) */}
        <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-1 md:pt-0 border-t md:border-t-0 border-[#EDF0F5] dark:border-[#1C2D4A]">
          {/* Results Count & Clear Button */}
          <div className="flex items-center gap-2 text-xs text-[#46546C] dark:text-[#9AA7BD]">
            <span aria-live="polite" className="tabular-nums">
              Showing <strong className="text-[#0B1B34] dark:text-[#E8EDF7] font-semibold">{filteredCount}</strong> of {totalCount}
            </span>

            {hasActiveFilters && (
              <button
                onClick={onClearFilters}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-[#1D4ED8] dark:text-[#6C8DF5] hover:underline"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* Desktop Controls */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* Sort Select */}
            <div className="relative flex items-center">
              <ArrowUpDown className="absolute left-2.5 w-3.5 h-3.5 text-[#7A869A] pointer-events-none" />
              <select
                value={sortOption}
                onChange={(e) => onSortChange(e.target.value as SortOption)}
                className="pl-8 pr-7 py-1.5 rounded-lg bg-[#F0F2F6] dark:bg-[#1B2C4B] border border-[#CBD3E0] dark:border-[#24365A] text-xs font-medium text-[#0B1B34] dark:text-[#E8EDF7] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/30 appearance-none cursor-pointer min-h-[36px]"
                aria-label="Sort countries"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-white dark:bg-[#14233D] text-[#0B1B34] dark:text-[#E8EDF7]">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center p-0.5 rounded-lg bg-[#F0F2F6] dark:bg-[#1B2C4B] border border-[#E3E7EE] dark:border-[#24365A]">
              <button
                onClick={() => onViewModeChange('grid')}
                className={`p-1.5 rounded-md transition-colors min-h-[30px] min-w-[30px] flex items-center justify-center cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-[#14233D] text-[#0B1B34] dark:text-white shadow-xs'
                    : 'text-[#7A869A] hover:text-[#0B1B34] dark:hover:text-white'
                }`}
                aria-label="Grid view"
                title="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => onViewModeChange('list')}
                className={`p-1.5 rounded-md transition-colors min-h-[30px] min-w-[30px] flex items-center justify-center cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-[#14233D] text-[#0B1B34] dark:text-white shadow-xs'
                    : 'text-[#7A869A] hover:text-[#0B1B34] dark:hover:text-white'
                }`}
                aria-label="List view"
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mobile Sort/View trigger */}
          <button
            onClick={() => setMobileSettingsOpen(true)}
            className="sm:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F0F2F6] dark:bg-[#1B2C4B] border border-[#CBD3E0] dark:border-[#24365A] text-xs font-semibold text-[#0B1B34] dark:text-[#E8EDF7] min-h-[36px]"
            aria-label="Sort and view settings"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#1D4ED8]" />
            <span>Options</span>
          </button>
        </div>
      </div>

      {/* Mobile Settings Sheet */}
      <AnimatePresence>
        {mobileSettingsOpen && (
          <div className="sm:hidden fixed inset-0 z-50 overflow-hidden flex flex-col justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSettingsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="relative w-full bg-white dark:bg-[#14233D] rounded-t-3xl border-t border-[#E3E7EE] dark:border-[#24365A] p-5 pb-safe shadow-2xl space-y-5"
            >
              <div className="flex justify-center -mt-2 mb-1">
                <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-white/20" />
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-[#EDF0F5] dark:border-[#1C2D4A]">
                <h3 className="font-heading font-bold text-base text-[#0B1B34] dark:text-[#E8EDF7]">
                  Display & Sorting Options
                </h3>
                <button
                  onClick={() => setMobileSettingsOpen(false)}
                  className="w-9 h-9 rounded-lg text-[#7A869A] hover:text-[#0B1B34] dark:hover:text-white flex items-center justify-center min-h-[36px]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sort Order */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-[#7A869A] uppercase tracking-wider block">
                  Sort Order
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => onSortChange(opt.value)}
                      className={`px-4 py-3 rounded-xl text-sm text-left font-medium transition-colors flex items-center justify-between min-h-[44px] ${
                        sortOption === opt.value
                          ? 'bg-[#E8EEFD] dark:bg-[#1D4ED8]/20 text-[#1D4ED8] dark:text-[#6C8DF5] font-bold'
                          : 'bg-[#F0F2F6] dark:bg-[#1B2C4B] text-[#0B1B34] dark:text-[#E8EDF7] border border-[#E3E7EE] dark:border-[#24365A]'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {sortOption === opt.value && (
                        <div className="w-2 h-2 rounded-full bg-[#1D4ED8] dark:bg-[#6C8DF5]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* View Mode */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-[#7A869A] uppercase tracking-wider block">
                  View Mode
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onViewModeChange('grid')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium min-h-[44px] ${
                      viewMode === 'grid'
                        ? 'bg-[#1D4ED8] text-white border-transparent font-bold'
                        : 'bg-[#F0F2F6] dark:bg-[#1B2C4B] text-[#0B1B34] dark:text-[#E8EDF7] border-[#E3E7EE] dark:border-[#24365A]'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                    <span>Grid View</span>
                  </button>
                  <button
                    onClick={() => onViewModeChange('list')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium min-h-[44px] ${
                      viewMode === 'list'
                        ? 'bg-[#1D4ED8] text-white border-transparent font-bold'
                        : 'bg-[#F0F2F6] dark:bg-[#1B2C4B] text-[#0B1B34] dark:text-[#E8EDF7] border-[#E3E7EE] dark:border-[#24365A]'
                    }`}
                  >
                    <List className="w-4 h-4" />
                    <span>List View</span>
                  </button>
                </div>
              </div>

              <button
                onClick={() => setMobileSettingsOpen(false)}
                className="w-full py-3 rounded-xl bg-[#1D4ED8] text-white font-semibold text-sm shadow-md active:scale-98 min-h-[44px]"
              >
                Apply
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
