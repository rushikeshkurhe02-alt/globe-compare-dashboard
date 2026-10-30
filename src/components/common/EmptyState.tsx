import { Globe, SearchX, RotateCcw } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  onClear?: () => void;
  clearLabel?: string;
}

export function EmptyState({
  title = 'No countries found',
  description = 'Try a different spelling or clear your active filters to see all nations.',
  onClear,
  clearLabel = 'Clear filters',
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-4">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full bg-[#E8EEFD] dark:bg-[#1D4ED8]/20 flex items-center justify-center border border-border-theme">
          <Globe className="w-10 h-10 text-[#1D4ED8] dark:text-[#6C8DF5]" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-surface border border-border-theme flex items-center justify-center shadow-md">
          <SearchX className="w-4 h-4 text-text-muted" />
        </div>
      </div>

      <h3 className="text-xl font-heading font-semibold text-text-primary mb-2">
        {title}
      </h3>
      <p className="text-sm text-text-secondary max-w-sm mb-6 leading-relaxed">
        {description}
      </p>

      {onClear && (
        <button
          onClick={onClear}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-surface hover:bg-surface-elevated border border-border-theme text-text-primary transition-all duration-150 shadow-sm active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{clearLabel}</span>
        </button>
      )}
    </div>
  );
}
