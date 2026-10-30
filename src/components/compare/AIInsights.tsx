import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  AlertCircle,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { CountryListItem, CountryIndicatorSummary, IndicatorKey } from '../../types';
import { COMPARE_COLORS } from '../../store/useCompareStore';
import { formatPopulation, formatArea } from '../../utils/format';
import { INDICATOR_CONFIGS } from '../../utils/normalize';

interface AIInsightsProps {
  countries: CountryListItem[];
  indicators: Record<string, Record<IndicatorKey, CountryIndicatorSummary>> | undefined;
  onOpenReport?: () => void;
  onInsightsReady?: (data: AIInsightsData) => void;
}

export interface AIInsightsData {
  summary: string;
  strengths: { country: string; points: string[] }[];
  weaknesses: { country: string; points: string[] }[];
  verdict: string;
}

// In-memory cache per combination of country codes so quota is saved
const insightsCache = new Map<string, AIInsightsData>();

export function AIInsights({
  countries,
  indicators,
  onOpenReport,
  onInsightsReady,
}: AIInsightsProps) {
  const cacheKey = useMemo(
    () =>
      countries
        .map((c) => c.cca3)
        .sort()
        .join('-'),
    [countries]
  );

  const [insights, setInsights] = useState<AIInsightsData | null>(
    () => insightsCache.get(cacheKey) || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to extract user-friendly error string
  const getCleanErrorMessage = (err: unknown): string => {
    if (!err) return 'Unable to generate AI insights right now.';
    const raw = err instanceof Error ? err.message : String(err);
    try {
      if (raw.trim().startsWith('{')) {
        const parsed = JSON.parse(raw);
        if (parsed.message) return parsed.message;
        if (parsed.error && typeof parsed.error === 'string') return parsed.error;
        if (parsed.error?.message) return parsed.error.message;
      }
    } catch {}
    return raw;
  };

  // Sync with cache if country selection changes
  useMemo(() => {
    const cached = insightsCache.get(cacheKey);
    if (cached) {
      setInsights(cached);
      setError(null);
      onInsightsReady?.(cached);
    } else {
      setInsights(null);
      setError(null);
    }
  }, [cacheKey]);

  const handleGenerate = async () => {
    if (countries.length < 2) return;

    setIsLoading(true);
    setError(null);

    // Format clean payload with country names and latest non-null indicators
    const countriesPayload = countries.map((c) => {
      const countryInd = indicators?.[c.cca3];
      const metrics: Record<string, string | number> = {
        name: c.name.common,
        code: c.cca3,
        region: c.region,
        population: formatPopulation(c.population),
        area: formatArea(c.area),
      };

      if (countryInd) {
        (Object.keys(countryInd) as IndicatorKey[]).forEach((key) => {
          const cfg = INDICATOR_CONFIGS[key];
          const summary = countryInd[key];
          if (summary?.latestValue !== null && summary?.latestValue !== undefined) {
            metrics[cfg.label] = `${summary.latestValue} ${cfg.unit} (${summary.latestYear || 'recent'})`;
          } else {
            metrics[cfg.label] = 'N/A';
          }
        });
      }

      return metrics;
    });

    try {
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ countriesData: countriesPayload }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${response.status}: Failed to generate insights`);
      }

      const data: AIInsightsData = await response.json();
      if (!data || !data.summary) {
        throw new Error('Received unexpected format from AI service.');
      }

      insightsCache.set(cacheKey, data);
      setInsights(data);
      onInsightsReady?.(data);
    } catch (err: any) {
      setError(getCleanErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#E3E7EE] dark:border-[#24365A] border-t-2 border-t-[#B8892B] bg-white dark:bg-[#14233D] p-5 sm:p-7 shadow-xs space-y-6 relative overflow-hidden">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EDF0F5] dark:border-[#1C2D4A] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#FBF3E0] dark:bg-[#B8892B]/20 text-[#B8892B] flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-heading font-bold text-[#0B1B34] dark:text-[#E8EDF7]">
                AI Comparative Insights
              </h3>
              <span className="text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-[#F0F2F6] dark:bg-[#1B2C4B] text-[#46546C] dark:text-[#9AA7BD] border border-[#CBD3E0] dark:border-[#24365A]">
                Powered by Gemini
              </span>
            </div>
            <p className="text-xs text-[#46546C] dark:text-[#9AA7BD] mt-0.5">
              Synthesis of macroeconomic, demographic, and development data
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onOpenReport && (
            <button
              onClick={onOpenReport}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#1D4ED8]/30 bg-[#E8EEFD] dark:bg-[#1D4ED8]/20 hover:bg-[#1D4ED8]/10 text-xs font-semibold text-[#1D4ED8] dark:text-[#6C8DF5] transition-all shadow-xs min-h-[38px] cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Download Report</span>
            </button>
          )}

          {insights && !isLoading && (
            <button
              onClick={handleGenerate}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#CBD3E0] dark:border-[#24365A] bg-[#F0F2F6] dark:bg-[#1B2C4B] hover:bg-[#E8EEFD] text-xs font-medium text-[#0B1B34] dark:text-[#E8EDF7] transition-all shadow-xs min-h-[38px] cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#1D4ED8]" />
              <span>Regenerate</span>
            </button>
          )}
        </div>
      </div>

      {/* Content State */}
      {!insights && !isLoading && !error && (
        <div className="py-8 sm:py-10 text-center max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[#E8EEFD] dark:bg-[#1D4ED8]/20 border border-[#CBD3E0] dark:border-[#24365A] flex items-center justify-center mx-auto text-[#1D4ED8] dark:text-[#6C8DF5]">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-heading font-semibold text-[#0B1B34] dark:text-[#E8EDF7]">
              Generate Synthesis for {countries.map((c) => c.name.common).join(' vs ')}
            </h4>
            <p className="text-xs sm:text-sm text-[#46546C] dark:text-[#9AA7BD] mt-1 leading-relaxed">
              Gemini will analyze GDP, population, longevity, literacy, and internet penetration to highlight key strengths and tradeoffs.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-[#1D4ED8] hover:bg-[#1E40AF] text-white shadow-sm active:scale-98 transition-all min-h-[44px] cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate insights</span>
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-5 animate-pulse py-4">
          <div className="space-y-2">
            <div className="h-4 bg-slate-200 dark:bg-white/[0.06] rounded w-3/4" />
            <div className="h-4 bg-slate-200 dark:bg-white/[0.06] rounded w-1/2" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {countries.map((c) => (
              <div
                key={c.cca3}
                className="h-44 rounded-xl bg-[#F0F2F6] dark:bg-[#1B2C4B] border border-[#E3E7EE] dark:border-[#24365A] p-4 space-y-3"
              >
                <div className="h-5 bg-slate-200 dark:bg-white/[0.08] rounded w-1/2" />
                <div className="h-3 bg-slate-200 dark:bg-white/[0.06] rounded w-3/4" />
                <div className="h-3 bg-slate-200 dark:bg-white/[0.06] rounded w-2/3" />
              </div>
            ))}
          </div>
          <div className="h-16 rounded-xl bg-[#F0F2F6] dark:bg-[#1B2C4B]" />
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="p-4 sm:p-5 rounded-xl border border-[#B91C1C]/30 bg-[#B91C1C]/10 text-[#0B1B34] dark:text-[#E8EDF7] space-y-3">
          <div className="flex items-center gap-2 text-[#B91C1C] text-sm font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Failed to generate AI insights</span>
          </div>
          <p className="text-xs text-[#46546C] dark:text-[#9AA7BD]">{error}</p>
          <button
            onClick={handleGenerate}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#B91C1C] text-white text-xs font-semibold hover:bg-red-700 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try again</span>
          </button>
        </div>
      )}

      {/* Populated Insights State */}
      {insights && !isLoading && (
        <AnimatePresence mode="wait">
          <motion.div
            key={cacheKey}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Executive Summary */}
            <div className="p-4 sm:p-5 rounded-xl bg-[#F0F2F6] dark:bg-[#1B2C4B] border border-[#E3E7EE] dark:border-[#24365A]">
              <span className="text-[11px] font-mono font-semibold text-[#1D4ED8] dark:text-[#6C8DF5] uppercase tracking-wider block mb-1">
                Executive Synthesis
              </span>
              <p className="text-sm sm:text-base text-[#0B1B34] dark:text-[#E8EDF7] leading-relaxed">
                {insights.summary}
              </p>
            </div>

            {/* Per-Country Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {countries.map((country, idx) => {
                const color = COMPARE_COLORS[idx % COMPARE_COLORS.length];
                const countryStrengths =
                  insights.strengths.find(
                    (s) =>
                      s.country.toLowerCase().includes(country.name.common.toLowerCase()) ||
                      country.name.common.toLowerCase().includes(s.country.toLowerCase()) ||
                      s.country.toLowerCase().includes(country.cca3.toLowerCase())
                  )?.points || [];

                const countryWeaknesses =
                  insights.weaknesses.find(
                    (w) =>
                      w.country.toLowerCase().includes(country.name.common.toLowerCase()) ||
                      country.name.common.toLowerCase().includes(w.country.toLowerCase()) ||
                      w.country.toLowerCase().includes(country.cca3.toLowerCase())
                  )?.points || [];

                return (
                  <div
                    key={country.cca3}
                    className="p-4 sm:p-5 rounded-xl border border-[#E3E7EE] dark:border-[#24365A] bg-white dark:bg-[#14233D] flex flex-col justify-between shadow-xs transition-all space-y-4"
                    style={{
                      borderTopWidth: '3px',
                      borderTopColor: color,
                    }}
                  >
                    <div className="flex items-center gap-2.5 pb-2 border-b border-[#EDF0F5] dark:border-[#1C2D4A]">
                      <img
                        src={country.flags.svg || country.flags.png}
                        alt=""
                        className="w-5 h-3.5 rounded object-cover shadow-xs border border-[#CBD3E0] dark:border-[#24365A] shrink-0"
                      />
                      <h4 className="font-heading font-bold text-sm sm:text-base text-[#0B1B34] dark:text-[#E8EDF7] truncate">
                        {country.name.common}
                      </h4>
                    </div>

                    {/* Strengths */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#15803D] dark:text-[#22C55E]">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Key Strengths</span>
                      </div>
                      <ul className="space-y-1.5 pl-1">
                        {countryStrengths.length > 0 ? (
                          countryStrengths.map((pt, pIdx) => (
                            <li
                              key={pIdx}
                              className="text-xs text-[#46546C] dark:text-[#9AA7BD] leading-snug flex items-start gap-1.5"
                            >
                              <span className="text-[#15803D] dark:text-[#22C55E] font-bold shrink-0">·</span>
                              <span>{pt}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-xs text-[#7A869A] italic">
                            Relative parity across indicators
                          </li>
                        )}
                      </ul>
                    </div>

                    {/* Weaknesses / Watch-outs */}
                    <div className="space-y-2 pt-2 border-t border-[#EDF0F5] dark:border-[#1C2D4A]">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#B45309] dark:text-[#F59E0B]">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Watch-outs</span>
                      </div>
                      <ul className="space-y-1.5 pl-1">
                        {countryWeaknesses.length > 0 ? (
                          countryWeaknesses.map((pt, pIdx) => (
                            <li
                              key={pIdx}
                              className="text-xs text-[#46546C] dark:text-[#9AA7BD] leading-snug flex items-start gap-1.5"
                            >
                              <span className="text-[#B45309] dark:text-[#F59E0B] font-bold shrink-0">·</span>
                              <span>{pt}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-xs text-[#7A869A] italic">
                            No critical lags observed
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Final Verdict Box */}
            <div className="p-4 sm:p-5 rounded-xl border border-[#CBD3E0] dark:border-[#24365A] bg-[#F0F2F6] dark:bg-[#1B2C4B] flex items-start gap-3 shadow-xs">
              <div className="p-2 rounded-lg bg-[#1D4ED8] text-white shrink-0 mt-0.5">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-heading font-bold text-[#1D4ED8] dark:text-[#6C8DF5] uppercase tracking-wider block">
                  Analytical Verdict
                </span>
                <p className="text-xs sm:text-sm font-medium text-[#0B1B34] dark:text-[#E8EDF7] mt-0.5 leading-relaxed">
                  {insights.verdict}
                </p>
              </div>
            </div>

            {/* Footer disclaimer */}
            <p className="text-[11px] text-[#7A869A] text-center pt-2">
              Synthesized by Gemini from World Bank live series data.
            </p>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
