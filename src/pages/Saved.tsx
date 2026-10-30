import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bookmark,
  ExternalLink,
  Trash2,
  Calendar,
  AlertCircle,
  Compass,
  ArrowRight,
  LogIn,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCountries } from '../hooks/useCountries';
import { useSavedComparisons, useDeleteSavedComparison } from '../hooks/useSavedComparisons';
import { CountryFlag } from '../components/ui/CountryFlag';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/common/ErrorState';

function formatRelativeTime(date: Date | null): string {
  if (!date || isNaN(date.getTime())) return 'Recently';
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 30) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays > 1) return `${diffDays} days ago`;
  if (diffHours === 1) return '1 hour ago';
  if (diffHours > 1) return `${diffHours} hours ago`;
  if (diffMin === 1) return '1 minute ago';
  if (diffMin > 1) return `${diffMin} minutes ago`;
  return 'Just now';
}

function getFriendlyErrorMessage(err: unknown): string {
  if (!err) return 'Could not load your saved comparisons. Please try again.';
  const raw = err instanceof Error ? err.message : String(err);
  try {
    if (raw.trim().startsWith('{')) {
      const parsed = JSON.parse(raw);
      if (parsed.error && typeof parsed.error === 'string') {
        if (parsed.error.toLowerCase().includes('permission') || parsed.error.toLowerCase().includes('insufficient')) {
          return 'Permission issue connecting to Firestore. Please verify you are signed in and try again.';
        }
        return parsed.error;
      }
    }
  } catch {
    // Fall back to clean string
  }
  if (raw.toLowerCase().includes('permission') || raw.toLowerCase().includes('insufficient')) {
    return 'Permission issue connecting to Firestore. Please verify you are signed in and try again.';
  }
  return raw || 'Could not load comparisons from the cloud.';
}

export default function Saved() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const { data: allCountries = [] } = useCountries();
  const { data: comparisons = [], isLoading, isError, error, refetch } = useSavedComparisons();
  const deleteMutation = useDeleteSavedComparison();

  // Track which item has confirmation open
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // If Auth is still initializing, show clean skeleton
  if (authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  // Protected route: If unauthenticated, render friendly sign-in prompt
  if (!user) {
    return (
      <div className="min-h-[70dvh] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl border border-border-theme bg-white dark:bg-[#14233D] text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-brand-indigo/10 border border-brand-indigo/20 flex items-center justify-center mx-auto text-brand-indigo">
            <Bookmark className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-heading font-bold text-text-primary">
              Sign in to view saved comparisons
            </h2>
            <p className="text-sm text-text-secondary mt-2 leading-relaxed">
              Sign in with your Google account to access your personal collection of saved country benchmarks.
            </p>
          </div>

          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl border border-border-theme bg-surface hover:bg-surface-elevated text-sm font-semibold text-text-primary shadow-xs active:scale-98 transition-all min-h-[48px]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign in with Google</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg-main relative pb-28 md:pb-16">
      {/* Header Bar */}
      <section className="border-b border-border-theme bg-surface/40 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-indigo mb-1">
              <Bookmark className="w-3.5 h-3.5" />
              <span>Personal Vault</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-text-primary">
              Saved Comparisons
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
              Revisit your saved benchmarks or launch live comparisons side-by-side.
            </p>
          </div>

          <Link
            to="/compare"
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs sm:text-sm font-semibold shadow-xs active:scale-95 transition-all min-h-[44px]"
          >
            <span>Create New Comparison</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl border border-border-theme bg-surface space-y-4 animate-pulse"
              >
                <div className="h-6 w-3/4 bg-slate-200 dark:bg-white/[0.06] rounded" />
                <div className="flex -space-x-2">
                  <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-white/[0.08]" />
                  <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-white/[0.08]" />
                </div>
                <div className="pt-3 border-t border-border-subtle flex justify-between">
                  <div className="h-8 w-20 bg-slate-200 dark:bg-white/[0.06] rounded-lg" />
                  <div className="h-8 w-16 bg-slate-200 dark:bg-white/[0.06] rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <ErrorState
            title="Unable to load comparisons"
            message={getFriendlyErrorMessage(error)}
            onRetry={() => refetch()}
          />
        ) : comparisons.length === 0 ? (
          /* Empty state */
          <div className="py-20 text-center max-w-md mx-auto space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-brand-indigo/10 border border-brand-indigo/20 flex items-center justify-center mx-auto text-brand-indigo">
              <Bookmark className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-heading font-bold text-text-primary">
                No saved comparisons yet
              </h3>
              <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">
                When you compare countries, click the "Save comparison" button to bookmark your analysis here.
              </p>
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-brand-indigo text-white shadow-md hover:bg-brand-indigo/90 active:scale-95 transition-all min-h-[44px]"
            >
              <Compass className="w-4 h-4" />
              <span>Explore countries</span>
            </Link>
          </div>
        ) : (
          /* Grid of saved comparisons */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {comparisons.map((item) => {
              const matchedCountries = item.countries.map((code) =>
                allCountries.find((c) => c.cca3.toUpperCase() === code.toUpperCase())
              );

              const isConfirmingDelete = confirmDeleteId === item.id;

              return (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl border border-border-theme bg-surface hover:bg-surface-elevated transition-all shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Header: Title + Relative Date */}
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-heading font-bold text-base text-text-primary truncate">
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-1 text-[11px] text-text-muted shrink-0 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{formatRelativeTime(item.createdAt)}</span>
                      </div>
                    </div>

                    {/* Overlapped flag avatar stack */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center -space-x-2.5 overflow-hidden py-1">
                        {item.countries.map((code, idx) => {
                          const country = matchedCountries[idx];
                          return (
                            <div
                              key={code}
                              className="w-9 h-9 rounded-full border-2 border-surface overflow-hidden shadow-xs relative bg-slate-100 dark:bg-white/[0.05]"
                              title={country?.name.common || code}
                            >
                              {country?.flags ? (
                                <CountryFlag
                                  cca2={country.cca2}
                                  name={country.name.common}
                                  fallbackSrc={country.flags.svg || country.flags.png}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center font-mono text-[10px] font-bold text-text-muted">
                                  {code}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="text-xs text-text-secondary truncate">
                        {matchedCountries.map((c, i) => c?.name.common || item.countries[i]).join(', ')}
                      </div>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="pt-3 border-t border-border-subtle flex items-center justify-between gap-2">
                    {isConfirmingDelete ? (
                      <div className="flex items-center gap-2 w-full justify-between animate-in fade-in">
                        <span className="text-xs text-red-500 font-medium">Delete?</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              deleteMutation.mutate(item.id);
                              setConfirmDeleteId(null);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors min-h-[36px]"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2.5 py-1 rounded-lg border border-border-theme text-xs text-text-muted hover:text-text-primary transition-colors min-h-[36px]"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => setConfirmDeleteId(item.id)}
                          className="p-2 rounded-xl text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                          aria-label="Delete comparison"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            const codes = item.countries.join(',');
                            navigate(`/compare?c=${codes}`);
                          }}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-indigo/10 hover:bg-brand-indigo/20 text-brand-indigo text-xs sm:text-sm font-semibold transition-colors min-h-[44px]"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
