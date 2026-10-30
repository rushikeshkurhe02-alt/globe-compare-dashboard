import { useState } from 'react';
import { Globe } from 'lucide-react';

interface CountryFlagProps {
  cca2?: string;
  name?: string;
  fallbackSrc?: string;
  className?: string;
  aspectClassName?: string;
}

export function CountryFlag({
  cca2,
  name,
  fallbackSrc,
  className = 'w-full h-full object-cover',
  aspectClassName,
}: CountryFlagProps) {
  const [hasError, setHasError] = useState(false);

  const cleanCode = (cca2 || '').trim().toLowerCase();

  if (hasError || !cleanCode) {
    return (
      <div
        className={`w-full h-full flex items-center justify-center bg-slate-100 dark:bg-white/[0.05] text-text-muted ${
          aspectClassName || ''
        }`}
        title={name || 'Country flag unavailable'}
      >
        <Globe className="w-1/2 h-1/2 opacity-40 shrink-0" />
      </div>
    );
  }

  const baseSrc = fallbackSrc || `https://flagcdn.com/w320/${cleanCode}.png`;
  const srcSet = `https://flagcdn.com/w160/${cleanCode}.png 160w, https://flagcdn.com/w320/${cleanCode}.png 320w, https://flagcdn.com/w640/${cleanCode}.png 640w`;

  return (
    <img
      src={baseSrc}
      srcSet={srcSet}
      sizes="(max-width: 640px) 160px, (max-width: 1024px) 320px, 640px"
      alt={name ? `Flag of ${name}` : 'Country flag'}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
