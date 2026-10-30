import { useState, useMemo, useDeferredValue } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sliders,
  DollarSign,
  HeartPulse,
  GraduationCap,
  Wifi,
  Users,
  Plus,
  Check,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  Info,
  Crown,
} from 'lucide-react';
import { useCountries } from '../hooks/useCountries';
import { useGlobalMatchData } from '../hooks/useGlobalMatchData';
import { useCompareStore } from '../store/useCompareStore';
import { CountryListItem } from '../types';
import {
  MatchWeights,
  calculateCountryMatchScores,
  CountryMatchScore,
} from '../utils/scorer';
import { formatPopulation, formatCurrency } from '../utils/format';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/common/ErrorState';

const PRESETS: { label: string; weights: MatchWeights }[] = [
  {
    label: 'Balanced',
    weights: { economy: 50, health: 50, education: 50, connectivity: 50, population: 50 },
  },
  {
    label: 'Career focused',
    weights: { economy: 90, connectivity: 85, education: 70, health: 60, population: 40 },
  },
  {
    label: 'Quality of life',
    weights: { health: 95, education: 85, connectivity: 80, economy: 75, population: 20 },
  },
];

const REGIONS = ['All', 'Africa', 'Americas', 'Asia', 'Europe', 'Oceania'];

export default function Match() {
  const { data: allCountries = [], isLoading: isLoadingCountries, error: countriesError, refetch: refetchCountries } =
    useCountries();
  const { data: globalData, isLoading: isLoadingIndicators, error: indicatorsError, refetch: refetchIndicators } =
    useGlobalMatchData();

  const { isCountrySelected, toggleCountry, getCountryColor } = useCompareStore();

  const [weights, setWeights] = useState<MatchWeights>({
    economy: 75,
    health: 80,
    education: 60,
    connectivity: 70,
    population: 40,
  });

  const [selectedRegion, setSelectedRegion] = useState('All');
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [showFormula, setShowFormula] = useState(false);

  // useDeferredValue ensures dragging sliders remains silky smooth
  const deferredWeights = useDeferredValue(weights);
  const deferredRegion = useDeferredValue(selectedRegion);

  const scores: CountryMatchScore[] = useMemo(() => {
    if (!allCountries.length || !globalData) return [];
    return calculateCountryMatchScores(
      allCountries,
      globalData,
      deferredWeights,
      deferredRegion
    );
  }, [allCountries, globalData, deferredWeights, deferredRegion]);

  const top10 = useMemo(() => scores.slice(0, 10), [scores]);
  const bestMatch = top10.length > 0 ? top10[0] : null;

  const totalWeight =
    weights.economy +
    weights.health +
    weights.education +
    weights.connectivity +
    weights.population;

  const handleSliderChange = (criterion: keyof MatchWeights, val: number) => {
    setWeights((prev) => ({ ...prev, [criterion]: val }));
  };

  const handleApplyPreset = (presetWeights: MatchWeights) => {
    setWeights(presetWeights);
  };

  const isLoading = isLoadingCountries || isLoadingIndicators;
  const isError = Boolean(countriesError || indicatorsError);

  return (
    <div className="min-h-screen flex flex-col bg-bg-main relative pb-28 md:pb-16">
      {/* Header Banner */}
      <section className="relative pt-8 pb-10 sm:pt-12 sm:pb-14 border-b border-border-theme bg-[#F6F7F9] dark:bg-[#0E1A2F] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8EEFD] dark:bg-[#1D4ED8]/20 text-[#1D4ED8] dark:text-[#6C8DF5] text-xs font-semibold uppercase tracking-[0.12em] mb-3 border border-[#CBD3E0] dark:border-[#24365A]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Country Matcher</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-heading font-extrabold tracking-tight text-[#0B1B34] dark:text-[#E8EDF7] mb-3">
            Find your{' '}
            <span className="text-[#1D4ED8] dark:text-[#6C8DF5]">
              best-fit country
            </span>
          </h1>

          <p className="text-sm sm:text-base text-[#46546C] dark:text-[#9AA7BD] max-w-xl mx-auto font-normal">
            Adjust your priorities across economic power, longevity, education, and digital access to discover which nation matches your profile.
          </p>
        </div>
      </section>

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 w-full flex flex-col lg:flex-row gap-8 items-start">
        {/* DESKTOP LEFT SIDEBAR CONTROLS */}
        <aside className="hidden lg:block w-80 xl:w-96 shrink-0 sticky top-24 space-y-6">
          <ControlsPanel
            weights={weights}
            onChangeWeight={handleSliderChange}
            onApplyPreset={handleApplyPreset}
            selectedRegion={selectedRegion}
            onSelectRegion={setSelectedRegion}
            totalWeight={totalWeight}
          />
        </aside>

        {/* RIGHT COLUMN: RESULTS */}
        <div className="flex-1 w-full space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-56 w-full rounded-2xl" />
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-18 w-full rounded-xl" />
                ))}
              </div>
            </div>
          ) : isError ? (
            <ErrorState
              title="Failed to calculate country scores"
              message="Could not load global indicator dataset from the World Bank."
              onRetry={() => {
                refetchCountries();
                refetchIndicators();
              }}
            />
          ) : totalWeight === 0 ? (
            <div className="py-16 text-center rounded-2xl border border-border-theme bg-white dark:bg-[#14233D] p-8 space-y-3">
              <Sliders className="w-10 h-10 text-[#1D4ED8] mx-auto opacity-50" />
              <h3 className="text-lg font-heading font-bold text-text-primary">
                All priority weights are set to 0
              </h3>
              <p className="text-sm text-text-secondary max-w-md mx-auto">
                Increase at least one slider (Economy, Health, Education, Connectivity, or Population) to generate live country rankings.
              </p>
              <button
                onClick={() => handleApplyPreset(PRESETS[0].weights)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#1D4ED8] text-white shadow-xs mt-2 cursor-pointer"
              >
                Apply Balanced Preset
              </button>
            </div>
          ) : top10.length === 0 ? (
            <div className="py-16 text-center rounded-2xl border border-border-theme bg-white dark:bg-[#14233D] p-8">
              <p className="text-sm text-text-secondary">
                No countries found matching your selected criteria in this region.
              </p>
            </div>
          ) : (
            <>
              {/* #1 BEST MATCH HERO PILLAR SPOTLIGHT WITH BOUNCING GOLD CROWN */}
              {bestMatch && (
                <div className="p-6 sm:p-8 rounded-2xl border-2 border-[#B8892B] bg-white dark:bg-[#14233D] shadow-sm relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#FBF3E0] dark:bg-[#B8892B]/20 text-[#B8892B] flex items-center justify-center font-bold shadow-2xs">
                        <Crown className="w-5 h-5 animate-bounce text-[#B8892B]" />
                      </div>
                      <span className="text-xs font-heading font-bold uppercase tracking-[0.12em] text-[#B8892B] dark:text-[#E5B453]">
                        #1 Best Match Country
                      </span>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        onClick={() => toggleCountry(bestMatch.country)}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer min-h-[40px] ${
                          isCountrySelected(bestMatch.country.cca3)
                            ? 'bg-[#1D4ED8] text-white border-transparent'
                            : 'bg-white dark:bg-[#1B2C4B] hover:bg-[#F0F2F6] text-[#0B1B34] dark:text-[#E8EDF7] border-[#CBD3E0] dark:border-[#24365A] shadow-xs'
                        }`}
                      >
                        {isCountrySelected(bestMatch.country.cca3) ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>In comparison</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add to compare</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Profile with 3D Flag Pillar and Crown */}
                  <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 mb-6">
                    {/* The #1 3D Flag Pillar with bobbing gold crown */}
                    <div
                      className="relative flex flex-col items-center pt-8 pb-3 select-none"
                      style={{ perspective: '800px' }}
                    >
                      {/* Gently Bobbing Gold Crown */}
                      <div className="absolute top-0 z-30 animate-bounce">
                        <div className="w-10 h-10 rounded-full bg-[#FBF3E0] dark:bg-[#B8892B]/20 border border-[#B8892B]/40 flex items-center justify-center text-[#B8892B] shadow-md">
                          <Crown className="w-6 h-6 stroke-[2.2]" />
                        </div>
                      </div>

                      {/* 3D Flag Pillar Box */}
                      <div
                        className="relative rounded-xs shadow-xl transition-transform duration-300 hover:scale-105"
                        style={{
                          width: '84px',
                          height: '140px',
                          transformStyle: 'preserve-3d',
                          transform: 'rotateX(8deg) rotateY(-10deg)',
                        }}
                      >
                        {/* Front Face */}
                        <div
                          className="absolute inset-0 rounded-xs overflow-hidden shadow-lg border border-white/20"
                          style={{
                            backgroundImage: `url(https://flagcdn.com/w320/${bestMatch.country.cca2.toLowerCase()}.png)`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            transform: 'translateZ(12px)',
                          }}
                        >
                          <div
                            className="absolute inset-0"
                            style={{
                              background:
                                'linear-gradient(to bottom, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.05) 50%, rgba(0,0,0,0.2) 100%)',
                            }}
                          />
                        </div>

                        {/* Right Face */}
                        <div
                          className="absolute top-0 bottom-0 right-0 w-[24px] rounded-r-xs overflow-hidden origin-right"
                          style={{
                            backgroundImage: `url(https://flagcdn.com/w320/${bestMatch.country.cca2.toLowerCase()}.png)`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'right center',
                            filter: 'brightness(0.65)',
                            transform: 'rotateY(90deg) translateZ(1px)',
                          }}
                        />

                        {/* Top Cap */}
                        <div
                          className="absolute top-0 left-0 right-0 h-[24px] rounded-t-xs overflow-hidden origin-top"
                          style={{
                            background: 'linear-gradient(to bottom, #FFFFFF 0%, #E3E7EE 100%)',
                            border: '1px solid rgba(255,255,255,0.8)',
                            transform: 'rotateX(90deg) translateZ(1px)',
                          }}
                        />

                        {/* Floor Contact Shadow */}
                        <div
                          className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-full h-3 rounded-full blur-xs opacity-50"
                          style={{
                            background: 'radial-gradient(ellipse at center, rgba(11,27,52,0.5) 0%, transparent 70%)',
                            transform: 'rotateX(90deg) translateZ(-4px)',
                          }}
                        />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1 text-center sm:text-left">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <h2 className="text-2xl sm:text-3xl font-heading font-bold text-[#0B1B34] dark:text-[#E8EDF7] truncate">
                          {bestMatch.country.name.common}
                        </h2>
                        <span className="text-xs font-mono font-medium text-[#7A869A] px-2 py-0.5 rounded bg-[#F0F2F6] dark:bg-[#1B2C4B]">
                          {bestMatch.country.cca3}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-[#46546C] dark:text-[#9AA7BD] mt-1">
                        {bestMatch.country.region} · {bestMatch.country.capital?.[0] || 'Capital N/A'} ·{' '}
                        {formatPopulation(bestMatch.country.population)} people
                      </p>
                    </div>

                    {/* Overall Score Badge */}
                    <div className="text-center sm:text-right shrink-0">
                      <span className="text-xs text-[#7A869A] font-medium block">Match Score</span>
                      <div className="text-3xl sm:text-4xl font-heading font-extrabold text-[#1D4ED8] dark:text-[#6C8DF5] tabular-nums">
                        {bestMatch.finalScore}
                        <span className="text-lg font-normal text-[#7A869A]">/100</span>
                      </div>
                    </div>
                  </div>

                  {/* Indicator Breakdown */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#EDF0F5] dark:border-[#1C2D4A] text-xs">
                    <div>
                      <span className="text-[#7A869A] text-[11px]">GDP per Capita</span>
                      <div className="font-semibold text-[#0B1B34] dark:text-[#E8EDF7] tabular-nums mt-0.5">
                        {bestMatch.breakdown.economy.raw
                          ? formatCurrency(bestMatch.breakdown.economy.raw)
                          : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <span className="text-[#7A869A] text-[11px]">Life Expectancy</span>
                      <div className="font-semibold text-[#0B1B34] dark:text-[#E8EDF7] tabular-nums mt-0.5">
                        {bestMatch.breakdown.health.raw
                          ? `${bestMatch.breakdown.health.raw.toFixed(1)} yrs`
                          : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <span className="text-[#7A869A] text-[11px]">Internet Access</span>
                      <div className="font-semibold text-[#0B1B34] dark:text-[#E8EDF7] tabular-nums mt-0.5">
                        {bestMatch.breakdown.connectivity.raw
                          ? `${bestMatch.breakdown.connectivity.raw.toFixed(1)}%`
                          : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <span className="text-[#7A869A] text-[11px]">Literacy Rate</span>
                      <div className="font-semibold text-[#0B1B34] dark:text-[#E8EDF7] tabular-nums mt-0.5">
                        {bestMatch.breakdown.education.raw
                          ? `${bestMatch.breakdown.education.raw.toFixed(1)}%`
                          : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TOP 10 RANKED LIST: Layout animation reordering */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-heading font-bold text-[#0B1B34] dark:text-[#E8EDF7]">
                    Top 10 Country Rankings
                  </h3>
                  <span className="text-xs text-[#7A869A]">Live min-max weighted</span>
                </div>

                <div className="space-y-2.5">
                  {top10.map((entry, index) => {
                    const isSelected = isCountrySelected(entry.country.cca3);
                    const color = isSelected ? getCountryColor(entry.country.cca3) : undefined;

                    return (
                      <motion.div
                        layout
                        key={entry.country.cca3}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className={`flex items-center justify-between p-3.5 sm:p-4 rounded-xl border bg-white dark:bg-[#14233D] hover:bg-[#F0F2F6] dark:hover:bg-[#1B2C4B] transition-colors shadow-xs ${
                          index === 0
                            ? 'border-[#B8892B]/50 ring-1 ring-[#B8892B]/20'
                            : 'border-[#E3E7EE] dark:border-[#24365A]'
                        }`}
                      >
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 pr-3">
                          {/* Rank badge */}
                          <div
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-heading font-bold text-xs sm:text-sm shrink-0 ${
                              index === 0
                                ? 'bg-[#B8892B] text-white shadow-xs'
                                : index === 1
                                ? 'bg-slate-300 dark:bg-white/20 text-[#0B1B34] dark:text-[#E8EDF7]'
                                : index === 2
                                ? 'bg-[#B45309] text-white'
                                : 'bg-[#F0F2F6] dark:bg-[#1B2C4B] text-[#7A869A]'
                            }`}
                          >
                            #{index + 1}
                          </div>

                          {/* Flag */}
                          <div className="w-10 h-7 sm:w-12 sm:h-8 rounded-md overflow-hidden border border-[#CBD3E0] dark:border-[#24365A] shrink-0 shadow-2xs">
                            <img
                              src={`https://flagcdn.com/w160/${entry.country.cca2.toLowerCase()}.png`}
                              alt=""
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>

                          {/* Title + Solid Blue Progress Bar (no gradient) */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-heading font-semibold text-sm sm:text-base text-[#0B1B34] dark:text-[#E8EDF7] truncate">
                                {entry.country.name.common}
                              </span>
                              <span className="text-[10px] font-mono text-[#7A869A] px-1.5 py-0.2 rounded bg-[#F0F2F6] dark:bg-[#1B2C4B]">
                                {entry.country.cca3}
                              </span>
                            </div>

                            {/* Solid Blue Progress bar (no gradient) */}
                            <div className="mt-1.5 flex items-center gap-2.5 max-w-xs sm:max-w-md">
                              <div className="flex-1 h-2 rounded-full bg-[#E3E7EE] dark:bg-[#24365A] overflow-hidden">
                                <motion.div
                                  className="h-full rounded-full bg-[#1D4ED8]"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${entry.finalScore}%` }}
                                  transition={{ duration: 0.35, ease: 'easeOut' }}
                                />
                              </div>
                              <span className="font-heading font-bold text-xs sm:text-sm text-[#1D4ED8] dark:text-[#6C8DF5] tabular-nums shrink-0">
                                {entry.finalScore}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Add to compare button */}
                        <div className="shrink-0">
                          <button
                            onClick={() => toggleCountry(entry.country)}
                            aria-label={isSelected ? `Remove ${entry.country.name.common}` : `Add ${entry.country.name.common} to compare`}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-150 border cursor-pointer min-h-[40px] min-w-[40px] ${
                              isSelected
                                ? 'text-white border-transparent shadow-xs'
                                : 'text-[#46546C] dark:text-[#9AA7BD] border-[#CBD3E0] dark:border-[#24365A] bg-white dark:bg-[#1B2C4B] hover:text-[#0B1B34] hover:border-[#1D4ED8]'
                            }`}
                            style={isSelected && color ? { backgroundColor: color } : isSelected ? { backgroundColor: '#1D4ED8' } : undefined}
                          >
                            {isSelected ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Plus className="w-4 h-4" />}
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Collapsible Formula Explanation */}
              <div className="pt-4">
                <button
                  onClick={() => setShowFormula(!showFormula)}
                  className="flex items-center gap-1.5 text-xs text-[#7A869A] hover:text-[#0B1B34] dark:hover:text-[#E8EDF7] transition-colors py-2 cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>How is this score calculated?</span>
                  {showFormula ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showFormula && (
                  <div className="mt-2 p-4 rounded-xl border border-[#E3E7EE] dark:border-[#24365A] bg-white dark:bg-[#14233D] text-xs text-[#46546C] dark:text-[#9AA7BD] space-y-2 leading-relaxed">
                    <p>
                      <strong>1. Min-Max Normalization:</strong> For each indicator (GDP per capita, longevity, literacy, internet usage, and population), the lowest and highest values among all nations are calculated. Each country’s raw metric is normalized onto a 0–100 scale:
                    </p>
                    <code className="block p-2 rounded bg-[#F0F2F6] dark:bg-[#1B2C4B] font-mono text-[11px] text-[#0B1B34] dark:text-[#E8EDF7]">
                      NormalizedScore = ((Raw - Min) / (Max - Min)) * 100
                    </code>
                    <p>
                      <strong>2. Weighted Composite Score:</strong> Each normalized score is multiplied by your chosen slider priority weight. The sum is divided by the total sum of active weights to produce your final custom match rating out of 100.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* MOBILE STICKY FLOATING ADJUST BUTTON */}
      <div className="lg:hidden fixed bottom-16 inset-x-0 z-30 flex justify-center pointer-events-none pb-2">
        <button
          onClick={() => setMobileSheetOpen(true)}
          className="pointer-events-auto flex items-center gap-2 px-5 py-3 rounded-full bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-semibold shadow-xl active:scale-95 transition-all min-h-[44px] cursor-pointer"
        >
          <Sliders className="w-4 h-4" />
          <span>Adjust Priorities</span>
        </button>
      </div>

      {/* MOBILE COLLAPSIBLE BOTTOM SHEET */}
      <AnimatePresence>
        {mobileSheetOpen && (
          <div className="lg:hidden fixed inset-0 z-50 overflow-hidden flex flex-col justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSheetOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="relative w-full max-h-[85dvh] bg-white dark:bg-[#14233D] rounded-t-3xl border-t border-[#E3E7EE] dark:border-[#24365A] p-5 overflow-y-auto pb-safe shadow-2xl space-y-6"
            >
              <div className="flex justify-center -mt-2 mb-1">
                <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-white/20" />
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-[#EDF0F5] dark:border-[#1C2D4A]">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#1D4ED8]" />
                  <h3 className="font-heading font-bold text-base text-[#0B1B34] dark:text-[#E8EDF7]">
                    Adjust Preferences
                  </h3>
                </div>
                <button
                  onClick={() => setMobileSheetOpen(false)}
                  className="p-2 rounded-lg text-[#7A869A] hover:text-[#0B1B34] min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <ControlsPanel
                weights={weights}
                onChangeWeight={handleSliderChange}
                onApplyPreset={handleApplyPreset}
                selectedRegion={selectedRegion}
                onSelectRegion={setSelectedRegion}
                totalWeight={totalWeight}
              />

              <button
                onClick={() => setMobileSheetOpen(false)}
                className="w-full py-3.5 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-semibold text-sm shadow-md active:scale-98 min-h-[48px] cursor-pointer"
              >
                Apply & View Rankings ({top10.length})
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ControlsPanelProps {
  weights: MatchWeights;
  onChangeWeight: (key: keyof MatchWeights, val: number) => void;
  onApplyPreset: (w: MatchWeights) => void;
  selectedRegion: string;
  onSelectRegion: (r: string) => void;
  totalWeight: number;
}

function ControlsPanel({
  weights,
  onChangeWeight,
  onApplyPreset,
  selectedRegion,
  onSelectRegion,
}: ControlsPanelProps) {
  const sliders: {
    key: keyof MatchWeights;
    label: string;
    icon: typeof DollarSign;
    desc: string;
  }[] = [
    {
      key: 'economy',
      label: 'Economy',
      icon: DollarSign,
      desc: 'GDP per capita & wealth',
    },
    {
      key: 'health',
      label: 'Health & Longevity',
      icon: HeartPulse,
      desc: 'Life expectancy at birth',
    },
    {
      key: 'education',
      label: 'Education',
      icon: GraduationCap,
      desc: 'Adult literacy rate',
    },
    {
      key: 'connectivity',
      label: 'Digital Connectivity',
      icon: Wifi,
      desc: 'Internet users penetration',
    },
    {
      key: 'population',
      label: 'Population Scale',
      icon: Users,
      desc: 'Total national population size',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Presets */}
      <div>
        <span className="text-xs font-semibold text-[#7A869A] uppercase tracking-wider block mb-2">
          One-Click Presets
        </span>
        <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => onApplyPreset(p.weights)}
              className="px-3 py-1.5 rounded-xl border border-[#CBD3E0] dark:border-[#24365A] bg-white dark:bg-[#14233D] hover:bg-[#F0F2F6] dark:hover:bg-[#1B2C4B] text-xs font-medium text-[#0B1B34] dark:text-[#E8EDF7] transition-colors min-h-[40px] flex items-center justify-center shrink-0 active:scale-97 cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sliders with solid blue filled track and white thumb */}
      <div className="p-4 sm:p-5 rounded-2xl border border-[#E3E7EE] dark:border-[#24365A] bg-white dark:bg-[#14233D] space-y-5">
        <div className="flex items-center justify-between pb-2 border-b border-[#EDF0F5] dark:border-[#1C2D4A]">
          <span className="text-xs font-heading font-bold text-[#0B1B34] dark:text-[#E8EDF7] uppercase tracking-wider">
            Priorities (0–100)
          </span>
          <span className="text-[11px] font-mono text-[#7A869A]">
            Drag to reweight
          </span>
        </div>

        {sliders.map((s) => {
          const Icon = s.icon;
          const val = weights[s.key];

          return (
            <div key={s.key} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-[#1D4ED8] dark:text-[#6C8DF5]" />
                  <span className="text-xs font-medium text-[#0B1B34] dark:text-[#E8EDF7]">
                    {s.label}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-[#1D4ED8] dark:text-[#6C8DF5] tabular-nums">
                  {val}%
                </span>
              </div>

              {/* Slider with solid blue filled track */}
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={val}
                onChange={(e) => onChangeWeight(s.key, parseInt(e.target.value, 10))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #1D4ED8 0%, #1D4ED8 ${val}%, #E3E7EE ${val}%, #E3E7EE 100%)`,
                }}
                aria-label={s.label}
              />
              <span className="text-[10px] text-[#7A869A] block">{s.desc}</span>
            </div>
          );
        })}
      </div>

      {/* Region Filter */}
      <div>
        <span className="text-xs font-semibold text-[#7A869A] uppercase tracking-wider block mb-2">
          Filter by Region
        </span>
        <div className="flex flex-wrap gap-1.5">
          {REGIONS.map((region) => {
            const isSelected = selectedRegion === region;
            return (
              <button
                key={region}
                onClick={() => onSelectRegion(region)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors min-h-[38px] flex items-center justify-center cursor-pointer ${
                  isSelected
                    ? 'bg-[#1D4ED8] text-white font-semibold shadow-xs'
                    : 'bg-white dark:bg-[#14233D] hover:bg-[#F0F2F6] dark:hover:bg-[#1B2C4B] text-[#46546C] dark:text-[#9AA7BD] border border-[#CBD3E0] dark:border-[#24365A]'
                }`}
              >
                {region}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
