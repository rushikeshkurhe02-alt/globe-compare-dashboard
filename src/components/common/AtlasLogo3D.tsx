import { useState } from 'react';

interface AtlasLogo3DProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showSubtitle?: boolean;
}

export function AtlasLogo3D({
  size = 'md',
  className = '',
  showSubtitle = false,
}: AtlasLogo3DProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Dimension scaling
  const dim = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : 'w-9 h-9';
  const textScale = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';

  return (
    <div
      className={`flex items-center gap-3 select-none ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ perspective: '600px' }}
    >
      {/* 3D Sphere Emblem Container */}
      <div
        className={`relative ${dim} shrink-0 transition-transform duration-500 ease-out`}
        style={{
          transformStyle: 'preserve-3d',
          transform: isHovered
            ? 'rotateY(25deg) rotateX(-12deg) scale(1.08)'
            : 'rotateY(0deg) rotateX(0deg) scale(1)',
        }}
      >
        {/* Ambient Glow behind the globe */}
        <div
          className="absolute -inset-1 rounded-full opacity-60 blur-xs transition-opacity duration-300"
          style={{
            background:
              'radial-gradient(circle, rgba(29, 78, 216, 0.45) 0%, rgba(15, 157, 138, 0.2) 60%, transparent 80%)',
          }}
        />

        {/* 1. Main 3D Sphere with realistic spherical depth shading */}
        <div
          className="relative w-full h-full rounded-full overflow-hidden shadow-md border border-white/40 dark:border-white/20"
          style={{
            background:
              'radial-gradient(circle at 32% 28%, #60A5FA 0%, #2563EB 35%, #1D4ED8 65%, #0E2A66 90%, #061330 100%)',
            boxShadow:
              'inset -3px -3px 6px rgba(0,0,0,0.45), inset 2px 2px 4px rgba(255,255,255,0.7), 0 4px 10px rgba(11,27,52,0.18)',
          }}
        >
          {/* Internal rotating longitudinal meridian arcs */}
          <div
            className={`absolute inset-0 rounded-full border border-white/35 transition-transform duration-1000 ${
              isHovered ? 'rotate-[180deg]' : 'rotate-0'
            }`}
            style={{
              transform: 'scaleX(0.48) rotate(45deg)',
            }}
          />
          <div
            className={`absolute inset-0 rounded-full border border-white/35 transition-transform duration-1000 ${
              isHovered ? 'rotate-[-180deg]' : 'rotate-0'
            }`}
            style={{
              transform: 'scaleX(0.48) rotate(-45deg)',
            }}
          />

          {/* Equator Line */}
          <div
            className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/40 -translate-y-1/2"
            style={{
              boxShadow: '0 0 3px rgba(255,255,255,0.6)',
            }}
          />

          {/* Spherical Specular Highlight (Glass shine) */}
          <div
            className="absolute top-0.5 left-1 w-3 h-2 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.9) 0%, transparent 75%)',
              transform: 'rotate(-25deg)',
            }}
          />

          {/* Lower bounce light */}
          <div
            className="absolute bottom-0 right-1 w-3.5 h-1.5 rounded-full pointer-events-none opacity-40"
            style={{
              background: 'radial-gradient(ellipse at center, #93C5FD 0%, transparent 80%)',
            }}
          />
        </div>

        {/* 2. 3D Floating Orbital Gold Ring */}
        <div
          className={`absolute -inset-1.5 rounded-full pointer-events-none transition-all duration-700 ${
            isHovered ? 'scale-110' : 'scale-100'
          }`}
          style={{
            border: '1.5px solid rgba(243, 202, 104, 0.75)',
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            transform: isHovered
              ? 'rotateX(75deg) rotateY(35deg) rotateZ(180deg)'
              : 'rotateX(72deg) rotateY(20deg)',
            boxShadow: '0 0 6px rgba(243, 202, 104, 0.4)',
          }}
        />

        {/* Tiny Orbiting Satellite / Node */}
        <div
          className="absolute w-1.5 h-1.5 rounded-full bg-[#F3CA68] shadow-xs pointer-events-none transition-all duration-700"
          style={{
            top: isHovered ? '0%' : '10%',
            right: isHovered ? '10%' : '0%',
            boxShadow: '0 0 4px #F3CA68',
          }}
        />
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col justify-center">
        <div className={`leading-none tracking-tight flex items-baseline gap-1.5 ${textScale}`}>
          <span className="font-heading font-extrabold text-[#0B1B34] dark:text-[#E8EDF7] tracking-tight">
            Atlas
          </span>
          <span className="font-sans font-semibold text-[#1D4ED8] dark:text-[#6C8DF5] tracking-normal">
            Compare
          </span>
        </div>
        {showSubtitle && (
          <span className="text-[10px] font-mono tracking-wider uppercase text-[#7A869A] dark:text-[#9AA7BD] mt-0.5">
            Global Benchmark Suite
          </span>
        )}
      </div>
    </div>
  );
}
