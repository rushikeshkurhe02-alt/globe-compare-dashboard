import React, { useEffect, useRef, useState, useMemo } from 'react';
import createGlobe, { Globe } from 'cobe';
import { CountryListItem } from '../../types';

interface Globe3DProps {
  countries?: CountryListItem[];
  activeCountryCode?: string | null;
  className?: string;
}

// Fallback coordinates for key international hubs / top populous nations if list is loading
const DEFAULT_LOCATIONS: { code: string; lat: number; lng: number; pop: number }[] = [
  { code: 'IND', lat: 20.5937, lng: 78.9629, pop: 1428627663 },
  { code: 'CHN', lat: 35.8617, lng: 104.1954, pop: 1411750000 },
  { code: 'USA', lat: 37.0902, lng: -95.7129, pop: 333287557 },
  { code: 'IDN', lat: -0.7893, lng: 113.9213, pop: 275501339 },
  { code: 'PAK', lat: 30.3753, lng: 69.3451, pop: 235824862 },
  { code: 'NGA', lat: 9.082, lng: 8.6753, pop: 218541212 },
  { code: 'BRA', lat: -14.235, lng: -51.9253, pop: 215313498 },
  { code: 'BGD', lat: 23.685, lng: 90.3563, pop: 171186372 },
  { code: 'RUS', lat: 61.524, lng: 105.3188, pop: 144236933 },
  { code: 'MEX', lat: 23.6345, lng: -102.5528, pop: 127504125 },
  { code: 'JPN', lat: 36.2048, lng: 138.2529, pop: 125124989 },
  { code: 'ETH', lat: 9.145, lng: 40.4897, pop: 123379924 },
  { code: 'PHL', lat: 12.8797, lng: 121.774, pop: 115559009 },
  { code: 'EGY', lat: 26.8206, lng: 30.8025, pop: 110990103 },
  { code: 'DEU', lat: 51.1657, lng: 10.4515, pop: 83794000 },
  { code: 'GBR', lat: 55.3781, lng: -3.436, pop: 67326569 },
  { code: 'FRA', lat: 46.2276, lng: 2.2137, pop: 67970000 },
  { code: 'ZAF', lat: -30.5595, lng: 22.9375, pop: 59893885 },
  { code: 'AUS', lat: -25.2744, lng: 133.7751, pop: 25690000 },
  { code: 'CAN', lat: 56.1304, lng: -106.3468, pop: 38929902 },
];

// 5-6 Animated international arcs with country colors
const SAMPLE_ARCS: { from: [number, number]; to: [number, number]; color?: [number, number, number] }[] = [
  { from: [37.0902, -95.7129], to: [51.1657, 10.4515], color: [0.114, 0.306, 0.847] }, // US to Germany (Blue)
  { from: [51.1657, 10.4515], to: [20.5937, 78.9629], color: [0.059, 0.616, 0.541] }, // Germany to India (Teal)
  { from: [20.5937, 78.9629], to: [36.2048, 138.2529], color: [0.91, 0.349, 0.047] }, // India to Japan (Orange)
  { from: [36.2048, 138.2529], to: [37.0902, -95.7129], color: [0.114, 0.306, 0.847] }, // Japan to US (Blue)
  { from: [37.0902, -95.7129], to: [-14.235, -51.9253], color: [0.059, 0.616, 0.541] }, // US to Brazil (Teal)
  { from: [-14.235, -51.9253], to: [-30.5595, 22.9375], color: [0.91, 0.349, 0.047] }, // Brazil to South Africa (Orange)
];

export function Globe3D({
  countries = [],
  activeCountryCode,
  className = '',
}: Globe3DProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hasWebGL, setHasWebGL] = useState<boolean>(true);
  const [isReady, setIsReady] = useState<boolean>(false);

  // Dragging and inertia refs
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null);
  const pointerInteractionMovement = useRef<number>(0);
  const dragVelocity = useRef<number>(0);

  // Rotation angles
  const phiRef = useRef<number>(0);
  const thetaRef = useRef<number>(0.2);
  const targetPhiRef = useRef<number | null>(null);
  const targetThetaRef = useRef<number | null>(null);

  // Visibility state
  const isVisibleRef = useRef<boolean>(true);

  // Top 20 country markers
  const markers = useMemo(() => {
    let topList = [...countries]
      .filter((c) => c.population && c.population > 0 && c.latlng && c.latlng.length === 2)
      .sort((a, b) => (b.population || 0) - (a.population || 0))
      .slice(0, 20);

    if (topList.length === 0) {
      return DEFAULT_LOCATIONS.map((loc) => ({
        location: [loc.lat, loc.lng] as [number, number],
        size: activeCountryCode === loc.code ? 0.14 : Math.max(0.04, Math.min(0.09, (loc.pop / 1.5e9) * 0.1)),
      }));
    }

    return topList.map((c) => {
      const isTarget = activeCountryCode === c.cca3;
      const pop = c.population || 1e7;
      const baseSize = Math.max(0.04, Math.min(0.09, (pop / 1.5e9) * 0.1));
      return {
        location: [c.latlng![0], c.latlng![1]] as [number, number],
        size: isTarget ? 0.15 : baseSize,
      };
    });
  }, [countries, activeCountryCode]);

  // When active country changes, calculate target phi/theta to rotate smoothly towards it
  useEffect(() => {
    if (!activeCountryCode) {
      targetPhiRef.current = null;
      targetThetaRef.current = null;
      return;
    }

    const found =
      countries.find((c) => c.cca3 === activeCountryCode && c.latlng) ||
      DEFAULT_LOCATIONS.find((loc) => loc.code === activeCountryCode);

    if (found) {
      const lat = 'latlng' in found && found.latlng ? found.latlng[0] : (found as any).lat;
      const lng = 'latlng' in found && found.latlng ? found.latlng[1] : (found as any).lng;

      if (typeof lat === 'number' && typeof lng === 'number') {
        const radLng = (-lng * Math.PI) / 180 - Math.PI / 2;
        const radLat = (lat * Math.PI) / 180 * 0.5;

        let currentPhi = phiRef.current;
        let diff = (radLng - currentPhi) % (Math.PI * 2);
        if (diff < -Math.PI) diff += Math.PI * 2;
        if (diff > Math.PI) diff -= Math.PI * 2;

        targetPhiRef.current = currentPhi + diff;
        targetThetaRef.current = Math.max(-0.4, Math.min(0.5, radLat));
      }
    }
  }, [activeCountryCode, countries]);

  // Initialize COBE globe
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check WebGL support
    try {
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setHasWebGL(false);
        return;
      }
    } catch {
      setHasWebGL(false);
      return;
    }

    let width = canvas.offsetWidth || 500;
    const isMobile = window.innerWidth < 768;
    const isLowPower = typeof navigator !== 'undefined' && navigator.hardwareConcurrency <= 4;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const maxDpr = isMobile ? 1.5 : 2;
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);

    let globe: Globe | null = null;
    let animId: number | null = null;

    try {
      globe = createGlobe(canvas, {
        devicePixelRatio: dpr,
        width: width * dpr,
        height: width * dpr,
        phi: 0,
        theta: 0.2,
        dark: 0,
        diffuse: 1.2,
        mapSamples: 16000,
        mapBrightness: 6,
        baseColor: [0.85, 0.9, 1],
        markerColor: [0.114, 0.306, 0.847], // Royal Blue
        glowColor: [0.91, 0.94, 1],
        markers,
        arcs: SAMPLE_ARCS,
        arcWidth: 1.2,
        arcHeight: 0.25,
      });

      setIsReady(true);
    } catch (e) {
      console.warn('Failed to initialize 3D Globe with COBE, using SVG fallback:', e);
      setHasWebGL(false);
      return;
    }

    // Animation render loop
    const render = () => {
      if (globe && isVisibleRef.current) {
        if (pointerInteracting.current !== null) {
          phiRef.current += pointerInteractionMovement.current;
          pointerInteractionMovement.current = 0;
        } else if (targetPhiRef.current !== null && targetThetaRef.current !== null) {
          phiRef.current += (targetPhiRef.current - phiRef.current) * 0.08;
          thetaRef.current += (targetThetaRef.current - thetaRef.current) * 0.08;

          if (Math.abs(targetPhiRef.current - phiRef.current) < 0.005) {
            targetPhiRef.current = null;
            targetThetaRef.current = null;
          }
        } else {
          if (Math.abs(dragVelocity.current) > 0.0002) {
            phiRef.current += dragVelocity.current;
            dragVelocity.current *= 0.95;
          } else if (!prefersReducedMotion && !isLowPower) {
            phiRef.current += 0.003;
          }
        }

        globe.update({
          phi: phiRef.current,
          theta: thetaRef.current,
          markers,
        });
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    // ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width) {
          const newWidth = Math.round(entry.contentRect.width);
          if (newWidth > 50 && newWidth !== width) {
            width = newWidth;
            if (canvas && globe) {
              canvas.width = width * dpr;
              canvas.height = width * dpr;
              globe.update({ width: width * dpr, height: width * dpr });
            }
          }
        }
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // IntersectionObserver to pause when off-screen
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          isVisibleRef.current = entry.isIntersecting && document.visibilityState !== 'hidden';
        }
      },
      { threshold: 0.05 }
    );

    if (canvas) {
      intersectionObserver.observe(canvas);
    }

    const handleVisibilityChange = () => {
      isVisibleRef.current = document.visibilityState !== 'hidden';
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (animId) cancelAnimationFrame(animId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      if (globe) {
        globe.destroy();
      }
    };
  }, [markers]);

  // Pointer event handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    pointerInteracting.current = { x: e.clientX, y: e.clientY };
    dragVelocity.current = 0;
    targetPhiRef.current = null;
    targetThetaRef.current = null;
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'grabbing';
      canvasRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (pointerInteracting.current !== null) {
      const deltaX = (e.clientX - pointerInteracting.current.x) * 0.005;
      const deltaY = (e.clientY - pointerInteracting.current.y) * 0.003;

      pointerInteractionMovement.current = deltaX;
      dragVelocity.current = deltaX;

      thetaRef.current = Math.max(-0.6, Math.min(0.6, thetaRef.current - deltaY));
      pointerInteracting.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    pointerInteracting.current = null;
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'grab';
      try {
        canvasRef.current.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
    }
  };

  if (!hasWebGL) {
    return (
      <div
        ref={containerRef}
        className={`relative aspect-square max-w-full flex items-center justify-center ${className}`}
      >
        <svg
          viewBox="0 0 400 400"
          className="w-full h-full text-[#1D4ED8]/30 dark:text-[#6C8DF5]/20 animate-spin-slow"
          fill="none"
        >
          <circle cx="200" cy="200" r="180" stroke="currentColor" strokeWidth="2" strokeDasharray="6 4" />
          <ellipse cx="200" cy="200" rx="180" ry="80" stroke="currentColor" strokeWidth="1.5" />
          <ellipse cx="200" cy="200" rx="180" ry="140" stroke="currentColor" strokeWidth="1.5" />
          <line x1="20" y1="200" x2="380" y2="200" stroke="currentColor" strokeWidth="1.5" />
          <line x1="200" y1="20" x2="200" y2="380" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="200" cy="200" r="176" fill="#E8EEFD" fillOpacity="0.4" />
        </svg>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative aspect-square max-w-full flex items-center justify-center select-none ${className}`}
    >
      {!isReady && (
        <div className="absolute inset-4 rounded-full border border-[#CBD3E0] dark:border-[#24365A] bg-[#E8EEFD]/40 dark:bg-[#1D4ED8]/10 animate-pulse" />
      )}

      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="w-full h-full cursor-grab touch-none rounded-full"
        style={{
          width: '100%',
          height: '100%',
          contain: 'layout paint size',
          opacity: isReady ? 1 : 0,
          transition: 'opacity 0.6s ease',
        }}
        aria-label="Interactive 3D World Globe"
      />
    </div>
  );
}
