import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Plus, Globe } from 'lucide-react';
import { CountryListItem } from '../../types';
import { CountryFlag } from '../ui/CountryFlag';
import { formatPopulation } from '../../utils/format';

interface AddCountryModalProps {
  isOpen: boolean;
  onClose: () => void;
  allCountries: CountryListItem[];
  selectedCodes: string[];
  onSelectCountry: (country: CountryListItem) => void;
}

export function AddCountryModal({
  isOpen,
  onClose,
  allCountries,
  selectedCodes,
  onSelectCountry,
}: AddCountryModalProps) {
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearch('');
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const available = allCountries.filter((c) => !selectedCodes.includes(c.cca3));

    if (!q) return available.slice(0, 30);

    return available
      .filter((c) => {
        const common = c.name.common.toLowerCase();
        const official = c.name.official.toLowerCase();
        const code = c.cca3.toLowerCase();
        const capital = c.capital ? c.capital.join(' ').toLowerCase() : '';
        return (
          common.includes(q) ||
          official.includes(q) ||
          code.includes(q) ||
          capital.includes(q)
        );
      })
      .slice(0, 30);
  }, [search, allCountries, selectedCodes]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg rounded-2xl bg-surface border border-border-theme shadow-2xl overflow-hidden flex flex-col max-h-[80vh] text-text-primary z-10"
        >
          {/* Search Header */}
          <div className="p-4 border-b border-border-theme flex items-center gap-3">
            <Search className="w-4 h-4 text-text-muted shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type country name or code (e.g., France, FRA)..."
              className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            />
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-slate-200/50 dark:hover:bg-white/[0.06] transition-colors"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Results List */}
          <div className="flex-1 overflow-y-auto p-2 divide-y divide-border-subtle">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-sm text-text-muted">
                <Globe className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>No countries match your search.</p>
              </div>
            ) : (
              filtered.map((country) => (
                <button
                  key={country.cca3}
                  onClick={() => {
                    onSelectCountry(country);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-200/50 dark:hover:bg-white/[0.06] text-left transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-5 rounded overflow-hidden shrink-0 border border-border-subtle">
                      <CountryFlag
                        cca2={country.cca2}
                        name={country.name.common}
                        fallbackSrc={country.flags.svg || country.flags.png}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-semibold text-sm text-text-primary truncate group-hover:text-brand-indigo transition-colors">
                          {country.name.common}
                        </span>
                        <span className="text-[10px] font-mono text-text-muted px-1 rounded bg-slate-200/60 dark:bg-white/[0.06]">
                          {country.cca3}
                        </span>
                      </div>
                      <span className="text-xs text-text-secondary truncate block">
                        {country.region} · {formatPopulation(country.population)} people
                      </span>
                    </div>
                  </div>

                  <div className="p-1.5 rounded-lg text-text-muted group-hover:text-white group-hover:bg-brand-indigo transition-all shrink-0">
                    <Plus className="w-4 h-4" />
                  </div>
                </button>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
