import React, { useState } from 'react';
import { Bookmark, Check, X, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCreateSavedComparison } from '../../hooks/useSavedComparisons';
import { CountryListItem } from '../../types';

interface SaveComparisonButtonProps {
  countries: CountryListItem[];
}

export function SaveComparisonButton({ countries }: SaveComparisonButtonProps) {
  const { user, signInWithGoogle } = useAuth();
  const createMutation = useCreateSavedComparison();

  const [isInputOpen, setIsInputOpen] = useState(false);
  const [comparisonName, setComparisonName] = useState('');
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);

  // Default suggested title based on countries
  const defaultName = countries.map((c) => c.name.common).join(' vs ');

  const handleStartSave = () => {
    if (!user) {
      setIsSignInModalOpen(true);
      return;
    }
    setComparisonName(defaultName);
    setIsInputOpen(true);
  };

  const handleConfirmSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comparisonName.trim() || countries.length < 2) return;

    const countryCodes = countries.map((c) => c.cca3);
    await createMutation.mutateAsync({
      name: comparisonName.trim(),
      countries: countryCodes,
    });
    setIsInputOpen(false);
  };

  return (
    <>
      {!isInputOpen ? (
        <button
          onClick={handleStartSave}
          disabled={countries.length < 2}
          className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl border border-border-theme bg-surface hover:bg-surface-elevated text-xs sm:text-sm font-semibold text-text-primary transition-all duration-150 shadow-xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
        >
          <Bookmark className="w-4 h-4 text-brand-indigo" />
          <span>Save comparison</span>
        </button>
      ) : (
        <form
          onSubmit={handleConfirmSave}
          className="flex items-center gap-1.5 bg-surface rounded-xl p-1 border border-brand-indigo/50 shadow-md animate-in fade-in"
        >
          <input
            type="text"
            value={comparisonName}
            onChange={(e) => setComparisonName(e.target.value)}
            placeholder="Comparison name..."
            autoFocus
            className="px-2.5 py-1.5 bg-transparent text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:outline-none w-36 sm:w-48"
          />
          <button
            type="submit"
            disabled={createMutation.isPending || !comparisonName.trim()}
            className="p-1.5 rounded-lg bg-brand-indigo text-white hover:opacity-90 disabled:opacity-50 transition-all min-h-[36px] min-w-[36px] flex items-center justify-center"
            title="Save"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsInputOpen(false)}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary transition-all min-h-[36px] min-w-[36px] flex items-center justify-center"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* Sign-in prompt modal */}
      {isSignInModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsSignInModalOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          <div className="relative w-full max-w-sm rounded-2xl bg-surface border border-border-theme shadow-2xl p-6 text-center space-y-4 z-10 animate-in zoom-in-95">
            <button
              onClick={() => setIsSignInModalOpen(false)}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-text-muted hover:text-text-primary min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-brand-indigo/10 border border-brand-indigo/20 flex items-center justify-center mx-auto text-brand-indigo">
              <Bookmark className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-heading font-bold text-lg text-text-primary">
                Sign in to save comparisons
              </h3>
              <p className="text-xs sm:text-sm text-text-secondary mt-1">
                Save and organize your favorite country comparisons across all your devices.
              </p>
            </div>

            <button
              onClick={async () => {
                await signInWithGoogle();
                setIsSignInModalOpen(false);
                setIsInputOpen(true);
              }}
              className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl border border-border-theme bg-surface hover:bg-surface-elevated text-sm font-semibold text-text-primary shadow-xs active:scale-98 transition-all min-h-[48px]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              <span>Continue with Google</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
