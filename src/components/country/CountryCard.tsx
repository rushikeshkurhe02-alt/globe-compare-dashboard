import React, { useState, useRef } from 'react';
import { Plus, Check, MapPin, Users } from 'lucide-react';
import { CountryListItem } from '../../types';
import { CountryFlag } from '../ui/CountryFlag';
import { useCompareStore } from '../../store/useCompareStore';
import { formatPopulation } from '../../utils/format';

interface CountryCardProps {
  country: CountryListItem;
  onOpenDetail: (country: CountryListItem) => void;
  viewMode?: 'grid' | 'list';
}

export function CountryCard({ country, onOpenDetail, viewMode = 'grid' }: CountryCardProps) {
  const { isCountrySelected, toggleCountry, getCountryColor } = useCompareStore();
  const selected = isCountrySelected(country.cca3);
  const color = selected ? getCountryColor(country.cca3) : undefined;

  // 3D Tilt state
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [tilt, setTilt] = useState<{ x: number; y: number; glareX: number; glareY: number }>({
    x: 0,
    y: 0,
    glareX: 50,
    glareY: 50,
  });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Max 8deg tilt
    const rotateX = ((centerY - y) / centerY) * 8;
    const rotateY = ((x - centerX) / centerX) * 8;

    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    setTilt({ x: rotateX, y: rotateY, glareX, glareY });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0, glareX: 50, glareY: 50 });
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleCountry(country);
  };

  const capital =
    country.capital && country.capital.length > 0 ? country.capital.join(', ') : 'No official capital';

  if (viewMode === 'list') {
    return (
      <div
        onClick={() => onOpenDetail(country)}
        className={`group relative flex items-center justify-between p-3.5 sm:p-4 rounded-[14px] border transition-all duration-200 cursor-pointer bg-white dark:bg-[#14233D] hover:-translate-y-0.5 active:scale-[0.99] ${
          selected
            ? 'border-[#1D4ED8] ring-1 ring-[#1D4ED8]/30 shadow-xs'
            : 'border-[#E3E7EE] dark:border-[#24365A] hover:border-[#CBD3E0] dark:hover:border-[#334B79] shadow-xs'
        }`}
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative aspect-[3/2] w-14 rounded-md overflow-hidden shrink-0 border border-[#CBD3E0] dark:border-[#24365A] bg-[#F0F2F6] dark:bg-[#1B2C4B] shadow-2xs">
            <CountryFlag
              cca2={country.cca2}
              name={country.name.common}
              fallbackSrc={country.flags.svg || country.flags.png}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-[17px] font-semibold text-[#0B1B34] dark:text-[#E8EDF7] truncate group-hover:text-[#1D4ED8] dark:group-hover:text-[#6C8DF5] transition-colors">
                {country.name.common}
              </h3>
              <span className="text-[11px] font-mono font-medium text-[#7A869A] px-1.5 py-0.5 rounded bg-[#F0F2F6] dark:bg-[#1B2C4B]">
                {country.cca3}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#46546C] dark:text-[#9AA7BD] mt-0.5">
              <span>{country.region}</span>
              <span className="text-[#CBD3E0] dark:text-[#24365A]">·</span>
              <span className="truncate max-w-[140px] sm:max-w-xs">{capital}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 shrink-0">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-[11px] text-[#7A869A]">Population</span>
            <span className="text-sm font-semibold tabular-nums text-[#0B1B34] dark:text-[#E8EDF7]">
              {formatPopulation(country.population)}
            </span>
          </div>

          <button
            onClick={handleToggle}
            aria-label={selected ? `Remove ${country.name.common} from comparison` : `Add ${country.name.common} to comparison`}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-150 border shrink-0 cursor-pointer ${
              selected
                ? 'text-white border-transparent shadow-xs'
                : 'text-[#46546C] dark:text-[#9AA7BD] bg-white dark:bg-[#1B2C4B] border-[#CBD3E0] dark:border-[#24365A] hover:text-[#0B1B34] hover:border-[#1D4ED8]'
            }`}
            style={selected && color ? { backgroundColor: color } : selected ? { backgroundColor: '#1D4ED8' } : undefined}
          >
            {selected ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>
      </div>
    );
  }

  // Grid view: White card, 1px border #E3E7EE, radius 14px, 3D tilt with moving glare
  return (
    <div
      style={{ perspective: '900px' }}
      className="w-full"
    >
      <div
        ref={cardRef}
        onClick={() => onOpenDetail(country)}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`group relative rounded-[14px] border transition-all duration-200 cursor-pointer bg-white dark:bg-[#14233D] overflow-hidden flex flex-col justify-between active:scale-[0.98] ${
          selected
            ? 'border-[#1D4ED8] ring-1 ring-[#1D4ED8]/30 shadow-md shadow-[#1D4ED8]/5'
            : 'border-[#E3E7EE] dark:border-[#24365A] hover:border-[#CBD3E0] dark:hover:border-[#334B79] shadow-xs'
        }`}
        style={{
          transformStyle: 'preserve-3d',
          transform: isHovered
            ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(-4px)`
            : 'rotateX(0deg) rotateY(0deg) translateY(0px)',
          transition: isHovered
            ? 'transform 0.1s ease-out, box-shadow 0.2s ease'
            : 'transform 0.4s ease-out, box-shadow 0.2s ease',
        }}
      >
        {/* Moving light glare highlight */}
        {isHovered && (
          <div
            className="absolute inset-0 pointer-events-none z-30 transition-opacity duration-200"
            style={{
              background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255, 255, 255, 0.4) 0%, transparent 60%)`,
            }}
          />
        )}

        {/* Large 3:2 flag banner at the top */}
        <div className="relative aspect-[3/2] w-full bg-[#F0F2F6] dark:bg-[#1B2C4B] border-b border-[#EDF0F5] dark:border-[#1C2D4A] overflow-hidden">
          <div
            className="w-full h-full transition-transform duration-200"
            style={{
              transform: isHovered
                ? `translate3d(${-tilt.y * 0.8}px, ${tilt.x * 0.8}px, 0)`
                : 'translate3d(0, 0, 0)',
            }}
          >
            <CountryFlag
              cca2={country.cca2}
              name={country.name.common}
              fallbackSrc={country.flags.svg || country.flags.png}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
            />
          </div>

          {/* Small circular compare "+" button overlapping the flag corner (selected = solid blue check) */}
          <button
            onClick={handleToggle}
            aria-label={selected ? `Remove ${country.name.common} from comparison` : `Add ${country.name.common} to comparison`}
            className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 shadow-sm cursor-pointer z-20 ${
              selected
                ? 'text-white ring-2 ring-white/90 scale-105'
                : 'bg-white/95 hover:bg-white text-[#0B1B34] border border-[#CBD3E0] hover:border-[#1D4ED8]'
            }`}
            style={selected && color ? { backgroundColor: color } : selected ? { backgroundColor: '#1D4ED8' } : undefined}
          >
            {selected ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : <Plus className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Card Content: Name, region label, Capital and Population mini-facts */}
        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between gap-1.5 mb-1">
              <h3 className="text-[17px] font-semibold text-[#0B1B34] dark:text-[#E8EDF7] truncate group-hover:text-[#1D4ED8] dark:group-hover:text-[#6C8DF5] transition-colors leading-tight">
                {country.name.common}
              </h3>
              <span className="text-[11px] font-mono font-medium text-[#7A869A] px-1.5 py-0.5 rounded bg-[#F0F2F6] dark:bg-[#1B2C4B] shrink-0">
                {country.cca3}
              </span>
            </div>

            <div className="text-xs text-[#46546C] dark:text-[#9AA7BD] font-medium">
              {country.region}{country.subregion ? ` · ${country.subregion}` : ''}
            </div>
          </div>

          {/* 2-Column Mini Facts Grid: Capital & Population */}
          <div className="pt-2.5 border-t border-[#EDF0F5] dark:border-[#1C2D4A] grid grid-cols-2 gap-2 text-xs">
            <div className="min-w-0">
              <div className="flex items-center gap-1 text-[11px] text-[#7A869A] mb-0.5">
                <MapPin className="w-3 h-3 shrink-0" />
                <span>Capital</span>
              </div>
              <div className="font-medium text-[#0B1B34] dark:text-[#E8EDF7] truncate text-xs">
                {capital}
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1 text-[11px] text-[#7A869A] mb-0.5">
                <Users className="w-3 h-3 shrink-0" />
                <span>Population</span>
              </div>
              <div className="font-semibold text-[#0B1B34] dark:text-[#E8EDF7] tabular-nums text-xs">
                {formatPopulation(country.population)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
