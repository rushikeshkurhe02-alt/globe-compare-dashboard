import { useState } from 'react';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp, WifiOff } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  error?: Error | null;
  onRetry?: () => void;
  isOffline?: boolean;
}

export function ErrorState({
  title = 'Unable to load country data',
  message = 'We encountered an issue fetching data from the public API. Please check your internet connection or try again.',
  error,
  onRetry,
  isOffline = false,
}: ErrorStateProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4 max-w-lg mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5 text-red-500 shadow-inner">
        {isOffline ? <WifiOff className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
      </div>

      <h3 className="text-xl font-heading font-semibold text-text-primary mb-2">
        {isOffline ? 'You appear to be offline' : title}
      </h3>
      <p className="text-sm text-text-secondary mb-6 leading-relaxed">
        {isOffline
          ? 'Network connectivity was lost. Please reconnect to view live statistics.'
          : message}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#1D4ED8] hover:bg-[#1E40AF] text-white shadow-sm transition-all duration-150 active:scale-95 mb-4 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Try again</span>
        </button>
      )}

      {error && (
        <div className="w-full mt-2 text-left">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary mx-auto transition-colors"
          >
            <span>{showDetails ? 'Hide error details' : 'View error details'}</span>
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showDetails && (
            <div className="mt-3 p-3 rounded-xl bg-surface border border-border-theme font-mono text-xs text-red-400 break-words whitespace-pre-wrap max-h-40 overflow-y-auto">
              {error.message || String(error)}
              {error.stack && (
                <div className="mt-2 text-[11px] opacity-75">{error.stack}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
