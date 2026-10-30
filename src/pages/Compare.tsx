import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Share2,
  Check,
  Plus,
  X,
  MapPin,
  ArrowLeft,
  Scale,
  RefreshCw,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { useCountries } from '../hooks/useCountries';
import { useIndicators } from '../hooks/useIndicators';
import { useCompareStore, COMPARE_COLORS } from '../store/useCompareStore';
import { CountryListItem, CountryDetail } from '../types';
import { fetchCountryDetail } from '../api/countries';
import { RadarCompare } from '../components/charts/RadarCompare';
import { TrendChart } from '../components/charts/TrendChart';
import { KeyStatsGrid } from '../components/compare/KeyStatsGrid';
import { ComparisonTable } from '../components/compare/ComparisonTable';
import { ComparePillars3D } from '../components/compare/ComparePillars3D';
import { AIInsights, AIInsightsData } from '../components/compare/AIInsights';
import { AddCountryModal } from '../components/country/AddCountryModal';
import { CountryFlag } from '../components/ui/CountryFlag';
import { formatPopulation } from '../utils/format';
import { toast } from '../store/useToastStore';

import { SaveComparisonButton } from '../components/compare/SaveComparisonButton';
import { ReportModal } from '../components/compare/ReportModal';

export default function Compare() {
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    selectedCountries,
    setCountries,
    removeCountry,
    addCountry,
  } = useCompareStore();

  const { data: allCountries = [] } = useCountries();

  const [copiedLink, setCopiedLink] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [aiInsightsData, setAiInsightsData] = useState<AIInsightsData | null>(null);
  const [countryDetails, setCountryDetails] = useState<Record<string, CountryDetail>>({});

  // Sync from URL params on load if codes exist
  useEffect(() => {
    const cParam = searchParams.get('c');
    if (cParam && allCountries.length > 0) {
      const codes = cParam
        .split(',')
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean)
        .slice(0, 3);

      const matchedCountries: CountryListItem[] = [];
      codes.forEach((code) => {
        const found = allCountries.find((c) => c.cca3.toUpperCase() === code);
        if (found) matchedCountries.push(found);
      });

      if (matchedCountries.length > 0) {
        setCountries(matchedCountries);
      }
    }
  }, [searchParams, allCountries, setCountries]);

  // Sync back to URL when selectedCountries changes
  useEffect(() => {
    if (selectedCountries.length > 0) {
      const codeStr = selectedCountries.map((c) => c.cca3).join(',');
      if (searchParams.get('c') !== codeStr) {
        setSearchParams({ c: codeStr }, { replace: true });
      }
    } else {
      if (searchParams.get('c')) {
        setSearchParams({}, { replace: true });
      }
    }
  }, [selectedCountries, searchParams, setSearchParams]);

  // Fetch deep details for selected countries (currencies, languages, maps, etc.)
  const selectedCodes = useMemo(
    () => selectedCountries.map((c) => c.cca3),
    [selectedCountries]
  );

  useEffect(() => {
    if (selectedCodes.length === 0) return;

    let isMounted = true;

    Promise.allSettled(
      selectedCodes.map(async (code) => {
        const d = await fetchCountryDetail(code);
        return { code, d };
      })
    ).then((results) => {
      if (!isMounted) return;
      const map: Record<string, CountryDetail> = {};
      results.forEach((r) => {
        if (r.status === 'fulfilled') {
          map[r.value.code] = r.value.d;
        }
      });
      setCountryDetails(map);
    });

    return () => {
      isMounted = false;
    };
  }, [selectedCodes]);

  // Fetch World Bank indicators for selected countries
  const {
    data: indicators,
    isLoading: isLoadingIndicators,
    refetch: refetchIndicators,
  } = useIndicators(selectedCodes);

  // Copy share link handler
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      toast('Comparison link copied to clipboard', 'success');
      setTimeout(() => setCopiedLink(false), 2200);
    } catch {
      toast('Failed to copy link', 'error');
    }
  };

  // Quick preset loader when < 2 selected
  const handleLoadPreset = (codes: string[]) => {
    const matched = codes
      .map((code) => allCountries.find((c) => c.cca3.toUpperCase() === code))
      .filter((c): c is CountryListItem => Boolean(c));
    setCountries(matched);
  };

  const isComparativeReady = selectedCountries.length >= 2;

  return (
    <div className="min-h-screen flex flex-col bg-bg-main relative pb-28 md:pb-16">
      {/* Top Banner / Breadcrumb & Action bar */}
      <div className="border-b border-border-theme bg-surface/50 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link
              to="/"
              className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-text-muted hover:text-text-primary transition-colors p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-white/[0.06] shrink-0 min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Explorer</span>
              <span className="sm:hidden">Explorer</span>
            </Link>
            <span className="text-border-theme hidden sm:inline">/</span>
            <span className="text-xs sm:text-sm font-heading font-semibold text-text-primary truncate">
              Comparison Workspace
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => refetchIndicators()}
              className="w-10 h-10 rounded-xl border border-border-theme bg-surface hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-colors flex items-center justify-center min-h-[44px]"
              title="Refresh indicator data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={handleCopyLink}
              disabled={selectedCountries.length === 0}
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl border border-border-theme bg-surface hover:bg-surface-elevated text-xs sm:text-sm font-medium text-text-primary transition-all duration-150 shadow-xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-500 hidden sm:inline">Link copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-text-muted" />
                  <span className="hidden sm:inline">Copy link</span>
                  <span className="sm:hidden">Share</span>
                </>
              )}
            </button>

            <button
              onClick={() => setIsReportModalOpen(true)}
              disabled={selectedCountries.length < 2}
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs sm:text-sm font-semibold shadow-xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[44px] cursor-pointer"
              title="Download or print executive comparison report"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Download Report</span>
              <span className="sm:hidden">Report</span>
            </button>

            <SaveComparisonButton countries={selectedCountries} />
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 w-full space-y-6 sm:space-y-8">
        {/* HEADER ROW: Country profile cards (Horizontal snap carousel on mobile) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-2xl font-heading font-bold text-text-primary">
              Compared Nations ({selectedCountries.length}/3)
            </h2>
            {selectedCountries.length < 2 && (
              <span className="text-xs text-amber-500 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Select 2+ nations</span>
              </span>
            )}
          </div>

          {/* Carousel container on mobile, Grid on desktop */}
          <div className="flex overflow-x-auto snap-x snap-mandatory sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 pb-2 sm:pb-0 scrollbar-none">
            {selectedCountries.map((country, idx) => {
              const color = COMPARE_COLORS[idx % COMPARE_COLORS.length];
              const capital =
                country.capital && country.capital.length > 0
                  ? country.capital.join(', ')
                  : 'N/A';

              return (
                <div
                  key={country.cca3}
                  className="relative p-4 sm:p-5 rounded-2xl border bg-surface flex flex-col justify-between shadow-xs transition-all duration-200 min-w-[260px] sm:min-w-0 snap-start shrink-0 sm:shrink"
                  style={{
                    borderTopWidth: '4px',
                    borderTopColor: color,
                    borderColor: 'var(--border-color)',
                  }}
                >
                  <button
                    onClick={() => removeCountry(country.cca3)}
                    aria-label={`Remove ${country.name.common}`}
                    className="absolute top-2.5 right-2.5 w-9 h-9 rounded-lg text-text-muted hover:text-text-primary hover:bg-slate-200/50 dark:hover:bg-white/[0.06] transition-colors flex items-center justify-center min-h-[36px]"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="flex items-start gap-3.5 mb-3">
                    <div className="w-14 h-10 sm:w-16 sm:h-11 rounded-lg overflow-hidden border border-border-theme shrink-0 bg-slate-100 dark:bg-white/[0.05] shadow-xs">
                      <CountryFlag
                        cca2={country.cca2}
                        name={country.name.common}
                        fallbackSrc={country.flags.svg || country.flags.png}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 pr-6">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <h3 className="font-heading font-bold text-base sm:text-lg text-text-primary truncate">
                          {country.name.common}
                        </h3>
                      </div>
                      <span className="text-xs font-mono text-text-muted">
                        {country.cca3} · {country.region}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-border-subtle flex items-center justify-between text-xs text-text-secondary">
                    <div className="flex items-center gap-1 truncate">
                      <MapPin className="w-3.5 h-3.5 text-text-muted shrink-0" />
                      <span className="truncate">{capital}</span>
                    </div>
                    <span className="font-mono font-medium text-text-primary tabular-nums shrink-0">
                      {formatPopulation(country.population)}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Dashed Add Country Card if < 3 */}
            {selectedCountries.length < 3 && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="group border-2 border-dashed border-border-theme hover:border-brand-indigo/60 rounded-2xl p-5 flex flex-col items-center justify-center text-center transition-all duration-200 bg-surface/30 hover:bg-surface-elevated/60 min-w-[240px] sm:min-w-0 snap-start shrink-0 sm:shrink min-h-[120px] active-press"
              >
                <div className="w-9 h-9 rounded-full bg-slate-200/50 dark:bg-white/[0.05] group-hover:bg-brand-indigo group-hover:text-white flex items-center justify-center text-text-muted transition-all duration-200 mb-1.5">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="font-heading font-semibold text-xs sm:text-sm text-text-primary group-hover:text-brand-indigo transition-colors">
                  Add another country
                </span>
                <span className="text-[11px] text-text-muted mt-0.5">
                  Compare up to 3 nations
                </span>
              </button>
            )}
          </div>
        </section>

        {/* If fewer than 2 countries selected: show prompt + presets */}
        {!isComparativeReady ? (
          <section className="py-10 px-4 sm:px-6 rounded-2xl border border-border-theme bg-white dark:bg-[#14233D] text-center max-w-2xl mx-auto space-y-5">
            <div className="w-14 h-14 rounded-full bg-[#E8EEFD] dark:bg-[#1D4ED8]/20 border border-[#CBD3E0] dark:border-[#24365A] flex items-center justify-center mx-auto text-[#1D4ED8] dark:text-[#6C8DF5]">
              <Scale className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-xl font-heading font-bold text-text-primary">
                Select 2 or 3 countries to compare
              </h3>
              <p className="text-xs sm:text-sm text-text-secondary mt-1.5 max-w-md mx-auto">
                Discover live differences in economy, health, digital access, and development.
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block">
                Quick comparison presets:
              </span>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => handleLoadPreset(['USA', 'CHN', 'IND'])}
                  className="px-3.5 py-2 rounded-xl border border-border-theme bg-surface hover:bg-surface-elevated text-xs font-medium text-text-primary transition-colors min-h-[40px] active-press"
                >
                  US vs China vs India
                </button>
                <button
                  onClick={() => handleLoadPreset(['DEU', 'FRA', 'GBR'])}
                  className="px-3.5 py-2 rounded-xl border border-border-theme bg-surface hover:bg-surface-elevated text-xs font-medium text-text-primary transition-colors min-h-[40px] active-press"
                >
                  Germany vs France vs UK
                </button>
                <button
                  onClick={() => handleLoadPreset(['JPN', 'KOR'])}
                  className="px-3.5 py-2 rounded-xl border border-border-theme bg-surface hover:bg-surface-elevated text-xs font-medium text-text-primary transition-colors min-h-[40px] active-press"
                >
                  Japan vs South Korea
                </button>
              </div>
            </div>

            <div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#1D4ED8] hover:bg-[#1E40AF] text-white shadow-sm active:scale-95 transition-all min-h-[44px] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Search & Add Country</span>
              </button>
            </div>
          </section>
        ) : (
          <>
            {/* 3D COMPARE PILLARS SKYLINE WITH METRIC SWITCHER */}
            <section>
              <ComparePillars3D countries={selectedCountries} indicators={indicators} />
            </section>

            {/* KEY STATS BENTO ROW (2 cols on mobile, 4 cols on desktop) */}
            <section className="space-y-3">
              <h3 className="text-base sm:text-lg font-heading font-semibold text-text-primary">
                Key Metrics Overview
              </h3>
              <KeyStatsGrid countries={selectedCountries} indicators={indicators} />
            </section>

            {/* CHARTS ROW: Radar (Relative 0-100) and Trend Chart (2000-2024) */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
              {/* Radar Chart Card */}
              <div className="p-4 sm:p-6 rounded-2xl border border-border-theme bg-white dark:bg-[#14233D] shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-base sm:text-lg font-heading font-semibold text-text-primary">
                      Multi-Indicator Radar
                    </h3>
                    <span className="text-xs text-text-muted">Normalized 0–100</span>
                  </div>
                  <p className="text-xs text-text-secondary mb-3">
                    Relative comparison across economy, health, education, and digital access.
                  </p>
                </div>

                <div className="flex-1 min-h-[300px]">
                  <RadarCompare
                    countries={selectedCountries}
                    indicators={indicators}
                    isLoading={isLoadingIndicators}
                  />
                </div>
              </div>

              {/* Historical Trend Chart Card */}
              <div className="p-4 sm:p-6 rounded-2xl border border-border-theme bg-white dark:bg-[#14233D] shadow-xs flex flex-col justify-between">
                <TrendChart
                  countries={selectedCountries}
                  indicators={indicators}
                  isLoading={isLoadingIndicators}
                />
              </div>
            </section>

            {/* FULL COMPARISON TABLE */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-heading font-semibold text-text-primary">
                  Detailed Attribute Breakdown
                </h3>
                <span className="text-xs text-text-muted hidden sm:inline">
                  Highest values highlighted in green
                </span>
              </div>

              <ComparisonTable
                countries={selectedCountries}
                details={countryDetails}
                indicators={indicators}
              />
            </section>

            {/* FEATURE A: AI INSIGHTS (POWERED BY GEMINI) */}
            <section>
              <AIInsights
                countries={selectedCountries}
                indicators={indicators}
                onOpenReport={() => setIsReportModalOpen(true)}
                onInsightsReady={(data) => setAiInsightsData(data)}
              />
            </section>
          </>
        )}
      </main>

      {/* Add Country Command Palette Modal */}
      <AddCountryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        allCountries={allCountries}
        selectedCodes={selectedCodes}
        onSelectCountry={addCountry}
      />

      {/* Executive Benchmark Download / Print Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        countries={selectedCountries}
        indicators={indicators}
        insights={aiInsightsData}
      />
    </div>
  );
}
