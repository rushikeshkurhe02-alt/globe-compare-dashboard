import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ExternalLink,
  MapPin,
  Users,
  Maximize2,
  DollarSign,
  Languages,
  Clock,
  Car,
  Compass,
  Check,
  Plus,
} from 'lucide-react';
import { CountryListItem } from '../../types';
import { CountryFlag } from '../ui/CountryFlag';
import { useCountryDetail } from '../../hooks/useCountryDetail';
import { useCompareStore } from '../../store/useCompareStore';
import { formatPopulation, formatArea } from '../../utils/format';
import { CountryDetailSkeleton } from '../ui/Skeleton';

interface CountryDrawerProps {
  country: CountryListItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectCountryCode?: (code: string) => void;
}

export function CountryDrawer({
  country,
  isOpen,
  onClose,
  onSelectCountryCode,
}: CountryDrawerProps) {
  const { data: detail, isLoading } = useCountryDetail(country?.cca3);
  const { isCountrySelected, toggleCountry, getCountryColor } = useCompareStore();

  const isSelected = country ? isCountrySelected(country.cca3) : false;
  const color = country && isSelected ? getCountryColor(country.cca3) : undefined;

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Listen for Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !country) return null;

  const currenciesStr = detail?.currencies
    ? Object.values(detail.currencies)
        .map((c) => `${c.name} (${c.symbol || ''})`)
        .join(', ')
    : 'N/A';

  const languagesStr = detail?.languages
    ? Object.values(detail.languages).join(', ')
    : 'N/A';

  const timezonesStr = detail?.timezones ? detail.timezones.slice(0, 4).join(', ') : 'N/A';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Desktop Container: Right Sheet / Mobile: Bottom Sheet */}
        <div className="fixed inset-x-0 bottom-0 md:inset-y-0 md:left-auto md:right-0 max-w-full flex">
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="w-full md:w-[480px] max-h-[90dvh] md:max-h-full h-[88dvh] md:h-full bg-surface border-t md:border-t-0 md:border-l border-border-theme rounded-t-3xl md:rounded-t-none shadow-2xl flex flex-col overflow-hidden text-text-primary"
          >
            {/* Mobile Drag Handle */}
            <div className="md:hidden flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-white/20" />
            </div>

            {/* Header bar */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border-theme shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-medium text-text-muted px-2 py-0.5 rounded bg-slate-200/50 dark:bg-white/[0.06]">
                  {country.cca3}
                </span>
                <span className="text-xs text-text-secondary">{country.region}</span>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl text-text-muted hover:text-text-primary hover:bg-slate-200/50 dark:hover:bg-white/[0.06] transition-colors flex items-center justify-center min-h-[44px] min-w-[44px]"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable content body */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-6">
              {/* Flag image */}
              <div className="w-full h-44 sm:h-52 rounded-2xl overflow-hidden bg-slate-100 dark:bg-white/[0.05] border border-border-theme shadow-xs flex items-center justify-center">
                <CountryFlag
                  cca2={country.cca2}
                  name={country.name.common}
                  fallbackSrc={country.flags.svg || country.flags.png}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Title & Official name */}
              <div>
                <h2 className="text-2xl sm:text-3xl font-heading font-bold text-text-primary">
                  {country.name.common}
                </h2>
                {detail?.name?.official && detail.name.official !== country.name.common && (
                  <p className="text-sm text-text-secondary mt-1 italic">
                    {detail.name.official}
                  </p>
                )}
                {country.capital && country.capital.length > 0 && (
                  <div className="flex items-center gap-1.5 text-sm text-text-secondary mt-2">
                    <MapPin className="w-4 h-4 text-brand-indigo shrink-0" />
                    <span>Capital: {country.capital.join(', ')}</span>
                  </div>
                )}
              </div>

              {isLoading ? (
                <CountryDetailSkeleton />
              ) : (
                <>
                  {/* Facts Bento Grid */}
                  <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                    <div className="p-3 sm:p-3.5 rounded-xl border border-border-theme bg-surface-elevated/40">
                      <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>Population</span>
                      </div>
                      <div className="text-sm sm:text-base font-semibold font-heading tabular-nums">
                        {formatPopulation(country.population)}
                      </div>
                    </div>

                    <div className="p-3 sm:p-3.5 rounded-xl border border-border-theme bg-surface-elevated/40">
                      <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1">
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Total Area</span>
                      </div>
                      <div className="text-sm sm:text-base font-semibold font-heading tabular-nums">
                        {formatArea(country.area)}
                      </div>
                    </div>

                    <div className="p-3 sm:p-3.5 rounded-xl border border-border-theme bg-surface-elevated/40">
                      <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1">
                        <Compass className="w-3.5 h-3.5" />
                        <span>Subregion</span>
                      </div>
                      <div className="text-xs sm:text-sm font-semibold truncate">
                        {country.subregion || country.region || 'N/A'}
                      </div>
                    </div>

                    <div className="p-3 sm:p-3.5 rounded-xl border border-border-theme bg-surface-elevated/40">
                      <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1">
                        <Car className="w-3.5 h-3.5" />
                        <span>Driving Side</span>
                      </div>
                      <div className="text-xs sm:text-sm font-semibold capitalize">
                        {detail?.car?.side ? `${detail.car.side} hand` : 'Right hand'}
                      </div>
                    </div>

                    <div className="p-3 sm:p-3.5 rounded-xl border border-border-theme bg-surface-elevated/40 col-span-2">
                      <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>Currency</span>
                      </div>
                      <div className="text-xs sm:text-sm font-semibold truncate">{currenciesStr}</div>
                    </div>

                    <div className="p-3 sm:p-3.5 rounded-xl border border-border-theme bg-surface-elevated/40 col-span-2">
                      <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1">
                        <Languages className="w-3.5 h-3.5" />
                        <span>Official Languages</span>
                      </div>
                      <div className="text-xs sm:text-sm font-semibold truncate">{languagesStr}</div>
                    </div>

                    <div className="p-3 sm:p-3.5 rounded-xl border border-border-theme bg-surface-elevated/40 col-span-2">
                      <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Timezones</span>
                      </div>
                      <div className="text-xs font-mono text-text-secondary truncate">
                        {timezonesStr}
                      </div>
                    </div>
                  </div>

                  {/* Bordering countries */}
                  {detail?.borders && detail.borders.length > 0 && (
                    <div className="pt-2">
                      <div className="text-xs font-medium text-text-muted mb-2 uppercase tracking-wider">
                        Bordering Countries ({detail.borders.length})
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {detail.borders.map((borderCode) => (
                          <button
                            key={borderCode}
                            onClick={() => onSelectCountryCode && onSelectCountryCode(borderCode)}
                            className="px-3 py-1.5 text-xs font-mono font-medium rounded-lg border border-border-theme bg-surface hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-colors min-h-[44px] flex items-center justify-center active-press"
                          >
                            {borderCode}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* External links */}
                  {detail?.maps?.googleMaps && (
                    <div className="pt-1">
                      <a
                        href={detail.maps.googleMaps}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-xs font-medium text-brand-indigo hover:underline min-h-[44px]"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open in Google Maps</span>
                      </a>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Bottom sticky drawer action with safe area padding */}
            <div className="p-4 sm:p-5 border-t border-border-theme bg-surface shrink-0 pb-safe">
              <button
                onClick={() => toggleCountry(country)}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-semibold transition-all duration-150 shadow-md active-press min-h-[48px]"
                style={
                  isSelected && color
                    ? { backgroundColor: color, color: '#FFFFFF' }
                    : {
                        backgroundColor: '#1D4ED8',
                        color: '#FFFFFF',
                      }
                }
              >
                {isSelected ? (
                  <>
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Added to Compare</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Add to Compare</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
