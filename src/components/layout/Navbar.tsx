import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Globe, Sun, Moon, Menu, X, ArrowRight, Sliders, Compass, Bookmark, Scale } from 'lucide-react';
import { useThemeStore } from '../../store/useThemeStore';
import { useCompareStore } from '../../store/useCompareStore';
import { UserNav } from './UserNav';
import { AtlasLogo3D } from '../common/AtlasLogo3D';

export function Navbar() {
  const location = useLocation();
  const { theme, toggleTheme } = useThemeStore();
  const { selectedCountries } = useCompareStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 8);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isExplore = location.pathname === '/';
  const isMatch = location.pathname === '/match';
  const isCompare = location.pathname === '/compare';
  const isSaved = location.pathname === '/saved';

  const compareUrl =
    selectedCountries.length > 0
      ? `/compare?c=${selectedCountries.map((c) => c.cca3).join(',')}`
      : '/compare';

  return (
    <header
      className={`sticky top-0 z-40 w-full bg-white dark:bg-[#14233D] border-b border-[#E3E7EE] dark:border-[#24365A] transition-all duration-200 ${
        scrolled ? 'shadow-xs' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* 3D Brand Emblem & Wordmark */}
        <Link
          to="/"
          className="flex items-center shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] rounded-xl min-h-[44px]"
        >
          <AtlasLogo3D size="md" />
        </Link>

        {/* Center: Explore, Match, Compare, Saved (active = 2px blue underline) */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#46546C] dark:text-[#9AA7BD] h-full">
          <Link
            to="/"
            className={`whitespace-nowrap shrink-0 transition-colors py-5 border-b-2 ${
              isExplore
                ? 'text-[#0B1B34] dark:text-[#E8EDF7] font-semibold border-[#1D4ED8]'
                : 'border-transparent hover:text-[#0B1B34] dark:hover:text-[#E8EDF7]'
            }`}
          >
            Explore
          </Link>

          <Link
            to="/match"
            className={`whitespace-nowrap shrink-0 transition-colors py-5 border-b-2 ${
              isMatch
                ? 'text-[#0B1B34] dark:text-[#E8EDF7] font-semibold border-[#1D4ED8]'
                : 'border-transparent hover:text-[#0B1B34] dark:hover:text-[#E8EDF7]'
            }`}
          >
            Match
          </Link>

          <Link
            to={compareUrl}
            className={`whitespace-nowrap shrink-0 transition-colors py-5 border-b-2 flex items-center gap-2 ${
              isCompare
                ? 'text-[#0B1B34] dark:text-[#E8EDF7] font-semibold border-[#1D4ED8]'
                : 'border-transparent hover:text-[#0B1B34] dark:hover:text-[#E8EDF7]'
            }`}
          >
            <span>Compare</span>
            {selectedCountries.length > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-full bg-[#1D4ED8] text-white text-[10px] font-bold tabular-nums">
                {selectedCountries.length}
              </span>
            )}
          </Link>

          <Link
            to="/saved"
            className={`whitespace-nowrap shrink-0 transition-colors py-5 border-b-2 ${
              isSaved
                ? 'text-[#0B1B34] dark:text-[#E8EDF7] font-semibold border-[#1D4ED8]'
                : 'border-transparent hover:text-[#0B1B34] dark:hover:text-[#E8EDF7]'
            }`}
          >
            Saved
          </Link>
        </nav>

        {/* Right Actions: Theme toggle + Outline Sign in button */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-xl text-[#46546C] dark:text-[#9AA7BD] hover:text-[#0B1B34] dark:hover:text-[#E8EDF7] hover:bg-[#F0F2F6] dark:hover:bg-[#1B2C4B] transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] min-h-[44px] min-w-[44px] cursor-pointer"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-[#46546C]" />
            )}
          </button>

          {/* User Profile / Outline Sign In Button */}
          <UserNav />

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-10 h-10 rounded-xl text-[#46546C] dark:text-[#9AA7BD] hover:text-[#0B1B34] dark:hover:text-[#E8EDF7] hover:bg-[#F0F2F6] dark:hover:bg-[#1B2C4B] transition-colors flex items-center justify-center min-h-[44px] min-w-[44px] cursor-pointer"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown sheet */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E3E7EE] dark:border-[#24365A] bg-white dark:bg-[#14233D] p-4 flex flex-col gap-2 shadow-xl animate-in slide-in-from-top-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium min-h-[44px] ${
              isExplore
                ? 'bg-[#E8EEFD] dark:bg-[#1D4ED8]/20 text-[#1D4ED8] dark:text-[#6C8DF5] font-semibold'
                : 'text-[#46546C] dark:text-[#9AA7BD] hover:text-[#0B1B34]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Compass className="w-4 h-4" />
              <span>Explore</span>
            </div>
            <ArrowRight className="w-4 h-4 opacity-50" />
          </Link>

          <Link
            to="/match"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium min-h-[44px] ${
              isMatch
                ? 'bg-[#E8EEFD] dark:bg-[#1D4ED8]/20 text-[#1D4ED8] dark:text-[#6C8DF5] font-semibold'
                : 'text-[#46546C] dark:text-[#9AA7BD] hover:text-[#0B1B34]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Sliders className="w-4 h-4" />
              <span>Match</span>
            </div>
            <ArrowRight className="w-4 h-4 opacity-50" />
          </Link>

          <Link
            to={compareUrl}
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium min-h-[44px] ${
              isCompare
                ? 'bg-[#E8EEFD] dark:bg-[#1D4ED8]/20 text-[#1D4ED8] dark:text-[#6C8DF5] font-semibold'
                : 'text-[#46546C] dark:text-[#9AA7BD] hover:text-[#0B1B34]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Scale className="w-4 h-4" />
              <span>Compare</span>
              {selectedCountries.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#1D4ED8] text-white text-[11px] font-bold">
                  {selectedCountries.length}
                </span>
              )}
            </div>
            <ArrowRight className="w-4 h-4 opacity-50" />
          </Link>

          <Link
            to="/saved"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium min-h-[44px] ${
              isSaved
                ? 'bg-[#E8EEFD] dark:bg-[#1D4ED8]/20 text-[#1D4ED8] dark:text-[#6C8DF5] font-semibold'
                : 'text-[#46546C] dark:text-[#9AA7BD] hover:text-[#0B1B34]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Bookmark className="w-4 h-4 text-[#1D4ED8]" />
              <span>Saved Comparisons</span>
            </div>
            <ArrowRight className="w-4 h-4 opacity-50" />
          </Link>
        </div>
      )}
    </header>
  );
}
