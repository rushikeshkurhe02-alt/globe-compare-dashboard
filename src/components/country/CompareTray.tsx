import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { X, ArrowRight, Scale, Trash2 } from 'lucide-react';
import { useCompareStore } from '../../store/useCompareStore';
import { CountryFlag } from '../ui/CountryFlag';

export function CompareTray() {
  const navigate = useNavigate();
  const { selectedCountries, removeCountry, clearAll, getCountryColor } = useCompareStore();

  const count = selectedCountries.length;
  const isReady = count >= 2;

  const handleCompare = () => {
    if (!isReady) return;
    const codes = selectedCountries.map((c) => c.cca3).join(',');
    navigate(`/compare?c=${codes}`);
  };

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.aside
          aria-label="Country comparison selection tray"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-[4.5rem] md:bottom-6 inset-x-3 sm:inset-x-4 max-w-3xl mx-auto z-40 pointer-events-none"
        >
          <div className="pointer-events-auto bg-white dark:bg-[#14233D] rounded-2xl p-3 sm:p-4 shadow-xl flex items-center justify-between gap-3 border border-[#CBD3E0] dark:border-[#24365A]">
            {/* Mobile View: Overlapping Flag Avatars */}
            <div className="flex sm:hidden items-center gap-2 min-w-0">
              <div className="flex items-center -space-x-2 overflow-hidden py-1">
                {selectedCountries.map((country) => (
                  <div
                    key={country.cca3}
                    className="w-7 h-7 rounded-full border-2 border-white dark:border-[#14233D] overflow-hidden shrink-0 shadow-xs relative"
                    title={country.name.common}
                  >
                    <CountryFlag
                      cca2={country.cca2}
                      name={country.name.common}
                      fallbackSrc={country.flags.svg || country.flags.png}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              <span className="text-xs font-semibold text-[#0B1B34] dark:text-[#E8EDF7] whitespace-nowrap">
                {count}/3 ready
              </span>
            </div>

            {/* Desktop / Tablet View: Chips with details */}
            <div className="hidden sm:flex items-center gap-2 overflow-x-auto py-1 max-w-full">
              <div className="flex items-center gap-1.5 text-xs text-[#7A869A] font-medium shrink-0 pl-1">
                <Scale className="w-3.5 h-3.5 text-[#1D4ED8]" />
                <span>Comparing:</span>
              </div>

              {selectedCountries.map((country) => {
                const color = getCountryColor(country.cca3);
                return (
                  <div
                    key={country.cca3}
                    className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-lg bg-[#F0F2F6] dark:bg-[#1B2C4B] border border-[#E3E7EE] dark:border-[#24365A] text-xs font-medium text-[#0B1B34] dark:text-[#E8EDF7] shrink-0"
                    style={{ borderLeftWidth: '3px', borderLeftColor: color }}
                  >
                    <div className="w-4 h-3 overflow-hidden rounded-xs shrink-0">
                      <CountryFlag
                        cca2={country.cca2}
                        name={country.name.common}
                        fallbackSrc={country.flags.svg || country.flags.png}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="truncate max-w-[110px]">{country.name.common}</span>
                    <button
                      onClick={() => removeCountry(country.cca3)}
                      className="text-[#7A869A] hover:text-[#0B1B34] dark:hover:text-white p-0.5 rounded transition-colors min-w-[20px] min-h-[20px] flex items-center justify-center cursor-pointer"
                      aria-label={`Remove ${country.name.common}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={clearAll}
                className="hidden sm:flex items-center gap-1 text-xs text-[#7A869A] hover:text-[#B91C1C] transition-colors px-2 py-1 rounded-lg min-h-[36px] cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>

              <button
                onClick={handleCompare}
                disabled={!isReady}
                className={`flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm min-h-[44px] ${
                  isReady
                    ? 'bg-[#1D4ED8] hover:bg-[#1E40AF] text-white cursor-pointer active:scale-95'
                    : 'bg-[#F0F2F6] dark:bg-[#1B2C4B] text-[#7A869A] cursor-not-allowed border border-[#E3E7EE] dark:border-[#24365A]'
                }`}
              >
                <span>{isReady ? 'Compare now' : 'Pick 2+'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
