import { Link, useLocation } from 'react-router-dom';
import { Compass, Sliders, Scale, Bookmark } from 'lucide-react';
import { useCompareStore } from '../../store/useCompareStore';

export function MobileTabBar() {
  const location = useLocation();
  const { selectedCountries } = useCompareStore();

  const isExplore = location.pathname === '/';
  const isMatch = location.pathname === '/match';
  const isCompare = location.pathname === '/compare';
  const isSaved = location.pathname === '/saved';

  const compareUrl =
    selectedCountries.length > 0
      ? `/compare?c=${selectedCountries.map((c) => c.cca3).join(',')}`
      : '/compare';

  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-border-theme transition-all pb-safe shadow-xl"
    >
      <div className="flex items-center justify-around h-14 px-1">
        {/* Explore Tab */}
        <Link
          to="/"
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-colors min-h-[44px] ${
            isExplore
              ? 'text-brand-indigo font-bold'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <div className="relative">
            <Compass className={`w-5 h-5 ${isExplore ? 'stroke-[2.5]' : ''}`} />
            {isExplore && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-indigo" />
            )}
          </div>
          <span className="text-[10px] tracking-tight">Explore</span>
        </Link>

        {/* Match Tab */}
        <Link
          to="/match"
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-colors min-h-[44px] ${
            isMatch
              ? 'text-brand-indigo font-bold'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <div className="relative">
            <Sliders className={`w-5 h-5 ${isMatch ? 'stroke-[2.5]' : ''}`} />
            {isMatch && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-indigo" />
            )}
          </div>
          <span className="text-[10px] tracking-tight">Match</span>
        </Link>

        {/* Compare Tab */}
        <Link
          to={compareUrl}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-colors min-h-[44px] relative ${
            isCompare
              ? 'text-brand-indigo font-bold'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <div className="relative">
            <Scale className={`w-5 h-5 ${isCompare ? 'stroke-[2.5]' : ''}`} />
            {selectedCountries.length > 0 && (
              <span className="absolute -top-1 -right-2 px-1 min-w-[16px] h-4 rounded-full bg-brand-indigo text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                {selectedCountries.length}
              </span>
            )}
            {isCompare && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-indigo" />
            )}
          </div>
          <span className="text-[10px] tracking-tight">Compare</span>
        </Link>

        {/* Saved Tab */}
        <Link
          to="/saved"
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-colors min-h-[44px] ${
            isSaved
              ? 'text-brand-indigo font-bold'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          <div className="relative">
            <Bookmark className={`w-5 h-5 ${isSaved ? 'stroke-[2.5]' : ''}`} />
            {isSaved && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-indigo" />
            )}
          </div>
          <span className="text-[10px] tracking-tight">Saved</span>
        </Link>
      </div>
    </nav>
  );
}
