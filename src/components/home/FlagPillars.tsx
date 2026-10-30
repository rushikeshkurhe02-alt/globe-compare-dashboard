import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CountryListItem } from '../../types';
import { formatPopulation } from '../../utils/format';

interface FlagPillarsProps {
  countries: CountryListItem[];
  onSelectCountry: (country: CountryListItem) => void;
  onHoverCountry?: (cca3: string | null) => void;
  className?: string;
}

export function FlagPillars({
  countries,
  onSelectCountry,
  onHoverCountry,
  className = '',
}: FlagPillarsProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [hasEntered, setHasEntered] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [parallax, setParallax] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Responsive pillar count: 16 desktop, 9 tablet, 7 mobile
  const [visibleSlots, setVisibleSlots] = useState<number>(16);

  useEffect(() => {
    const updateSlots = () => {
      const w = window.innerWidth;
      if (w < 640) {
        setVisibleSlots(7);
      } else if (w < 1024) {
        setVisibleSlots(9);
      } else {
        setVisibleSlots(16);
      }
    };

    updateSlots();
    window.addEventListener('resize', updateSlots, { passive: true });
    return () => window.removeEventListener('resize', updateSlots);
  }, []);

  // Trigger rise-up entrance once loaded
  useEffect(() => {
    const timer = setTimeout(() => setHasEntered(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Check hardware and motion preferences
  const isReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const isLowPower = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return navigator.hardwareConcurrency <= 4;
  }, []);

  // Mouse parallax on desktop (rAF-throttled)
  useEffect(() => {
    if (isReducedMotion || window.innerWidth < 1024) return;

    let rafId: number | null = null;
    const handleMouseMove = (e: MouseEvent) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        const dx = (e.clientX - cx) / cx;
        const dy = (e.clientY - cy) / cy;
        setParallax({ x: dx * 10, y: dy * 6 });
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isReducedMotion]);

  // Select top populous nations dynamically and arrange in a pleasing wave
  const pillars = useMemo(() => {
    if (!countries.length) return [];

    const sorted = [...countries]
      .filter((c) => c.population && c.population > 0)
      .sort((a, b) => (b.population || 0) - (a.population || 0))
      .slice(0, visibleSlots);

    if (sorted.length === 0) return [];

    const maxPop = sorted[0].population || 1.4e9;
    const minPop = sorted[sorted.length - 1].population || 5e7;

    // Arrange in a symmetrical wave: alternate left & right from the center
    const waveArranged: CountryListItem[] = new Array(sorted.length);
    let left = 0;
    let right = sorted.length - 1;

    for (let i = 0; i < sorted.length; i++) {
      if (i % 2 === 0) {
        waveArranged[right] = sorted[i];
        right--;
      } else {
        waveArranged[left] = sorted[i];
        left++;
      }
    }

    return waveArranged.map((country, idx) => {
      const pop = country.population || 0;
      // Proportional height: min 140px, max 320px
      const norm = Math.max(0, Math.min(1, (pop - minPop) / (maxPop - minPop || 1)));
      // Curve with a slight sine modulation for visual harmony
      const sineMod = Math.sin((idx / (sorted.length - 1 || 1)) * Math.PI) * 40;
      const height = Math.round(140 + norm * 140 + sineMod);

      // Rank in global population
      const rank = sorted.findIndex((s) => s.cca3 === country.cca3) + 1;

      return {
        country,
        height,
        rank,
        iso2: country.cca2.toLowerCase(),
      };
    });
  }, [countries, visibleSlots]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-visible ${className}`}
      style={{
        perspective: '1400px',
      }}
    >
      {/* 3D Floor contact line and reflection plane */}
      <div
        className="w-full flex items-end justify-center gap-1.5 sm:gap-2.5 md:gap-3.5 px-2 sm:px-4 py-3"
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(8deg) rotateY(-12deg) translate3d(${parallax.x}px, ${parallax.y}px, 0px)`,
          transition: 'transform 0.15s ease-out',
        }}
      >
        {pillars.map((item, idx) => {
          const isHovered = hoveredIdx === idx;
          const isNeighborLeft = hoveredIdx !== null && idx === hoveredIdx - 1;
          const isNeighborRight = hoveredIdx !== null && idx === hoveredIdx + 1;

          // Staggered entrance delay (60ms)
          const enterDelay = idx * 60;

          // Idle float animation parameters
          const floatDuration = 6 + (idx % 4);
          const floatDelay = (idx * 0.4) % 3;

          // Neighbor lean reaction
          let neighborLean = 0;
          if (isNeighborLeft) neighborLean = -3.5;
          if (isNeighborRight) neighborLean = 3.5;

          const flagUrl = `https://flagcdn.com/w320/${item.iso2}.png`;

          return (
            <div
              key={item.country.cca3}
              onMouseEnter={() => {
                setHoveredIdx(idx);
                onHoverCountry?.(item.country.cca3);
              }}
              onMouseLeave={() => {
                setHoveredIdx(null);
                onHoverCountry?.(null);
              }}
              onClick={() => onSelectCountry(item.country)}
              className="relative group cursor-pointer select-none"
              style={{
                width: 'min(44px, 5.5vw)',
                height: `${item.height}px`,
                transformStyle: 'preserve-3d',
                transformOrigin: 'bottom center',
                transform: hasEntered
                  ? `translateY(${isHovered ? -24 : 0}px) rotateZ(${neighborLean}deg)`
                  : 'scaleY(0)',
                transition: hasEntered
                  ? 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)'
                  : `transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${enterDelay}ms`,
              }}
              title={`${item.country.name.common} (Rank #${item.rank})`}
            >
              {/* Idle Float wrapper (active after entrance, disabled on low-power/reduced-motion) */}
              <div
                className="w-full h-full relative"
                style={{
                  transformStyle: 'preserve-3d',
                  animation:
                    hasEntered && !isReducedMotion && !isLowPower && !isHovered
                      ? `pillarFloat ${floatDuration}s ease-in-out ${floatDelay}s infinite alternate`
                      : 'none',
                }}
              >
                {/* 1. FRONT FACE: Flag image with soft vertical gloss overlay */}
                <div
                  className="absolute inset-0 rounded-xs overflow-hidden shadow-md"
                  style={{
                    backgroundImage: `url(${flagUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    transform: 'translateZ(10px)',
                  }}
                >
                  {/* Soft vertical gloss gradient */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        'linear-gradient(to bottom, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.05) 40%, rgba(0,0,0,0.2) 100%)',
                    }}
                  />
                  {/* Subtle rim highlight */}
                  <div className="absolute inset-0 border border-white/30 rounded-xs pointer-events-none" />
                </div>

                {/* 2. RIGHT FACE: Same flag darkened (brightness 0.65) for 3D depth */}
                <div
                  className="absolute top-0 bottom-0 right-0 w-[18px] rounded-r-xs overflow-hidden origin-right"
                  style={{
                    backgroundImage: `url(${flagUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'right center',
                    filter: 'brightness(0.65) contrast(1.1)',
                    transform: 'rotateY(90deg) translateZ(1px)',
                  }}
                />

                {/* 3. TOP CAP: Light cap with thin highlight */}
                <div
                  className="absolute top-0 left-0 right-0 h-[18px] rounded-t-xs overflow-hidden origin-top"
                  style={{
                    background:
                      'linear-gradient(to bottom, #FFFFFF 0%, #E3E7EE 100%)',
                    border: '1px solid rgba(255,255,255,0.8)',
                    transform: 'rotateX(90deg) translateZ(1px)',
                    boxShadow: '0 -2px 6px rgba(255,255,255,0.5)',
                  }}
                />

                {/* 4. SOFT CONTACT SHADOW ON FLOOR */}
                <div
                  className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-full h-3 rounded-full blur-xs opacity-50 pointer-events-none"
                  style={{
                    background: 'radial-gradient(ellipse at center, rgba(11,27,52,0.45) 0%, transparent 70%)',
                    transform: 'rotateX(90deg) translateZ(-5px)',
                  }}
                />

                {/* 5. FAINT FLOOR REFLECTION */}
                <div
                  className="absolute -bottom-14 left-0 right-0 h-12 overflow-hidden opacity-15 pointer-events-none origin-top rounded-b-xs"
                  style={{
                    backgroundImage: `url(${flagUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    transform: 'scaleY(-1) rotateX(20deg)',
                    maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 90%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 90%)',
                  }}
                />
              </div>

              {/* FLOATING HOVER CARD ON DESKTOP */}
              {isHovered && (
                <div
                  className="absolute -top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150"
                  style={{ minWidth: '160px' }}
                >
                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#14233D] border border-[#CBD3E0] dark:border-[#24365A] shadow-xl text-center space-y-1">
                    <div className="flex items-center justify-center gap-1.5">
                      <img
                        src={flagUrl}
                        alt=""
                        className="w-4 h-3 rounded-xs object-cover border border-slate-200 dark:border-white/20"
                      />
                      <span className="font-heading font-bold text-xs text-[#0B1B34] dark:text-[#E8EDF7] truncate max-w-[110px]">
                        {item.country.name.common}
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-[10px] text-[#46546C] dark:text-[#9AA7BD]">
                      <span className="font-mono font-semibold text-[#1D4ED8] dark:text-[#6C8DF5]">
                        #{item.rank}
                      </span>
                      <span>·</span>
                      <span className="tabular-nums font-medium">
                        {formatPopulation(item.country.population)}
                      </span>
                    </div>
                    <div className="text-[9px] text-[#7A869A] pt-0.5">Click for details</div>
                  </div>
                  {/* Little bottom arrow */}
                  <div className="w-2 h-2 bg-white dark:bg-[#14233D] border-r border-b border-[#CBD3E0] dark:border-[#24365A] rotate-45 mx-auto -mt-1" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes pillarFloat {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-6px);
          }
          100% {
            transform: translateY(0px);
          }
        }
      `}</style>
    </div>
  );
}
