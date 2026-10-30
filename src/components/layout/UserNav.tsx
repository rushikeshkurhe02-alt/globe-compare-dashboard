import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Skeleton } from '../ui/Skeleton';

export function UserNav() {
  const { user, loading, signInWithGoogle, signOutUser } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDropdownOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (loading) {
    return <Skeleton className="w-10 h-10 rounded-full shrink-0" />;
  }

  if (!user) {
    return (
      <button
        onClick={signInWithGoogle}
        className="flex items-center gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl border border-border-theme bg-surface hover:bg-surface-elevated text-xs sm:text-sm font-semibold text-text-primary transition-all shadow-xs active:scale-95 shrink-0 min-h-[44px]"
      >
        {/* Google G Symbol */}
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
        <span className="hidden sm:inline">Sign in</span>
      </button>
    );
  }

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="w-10 h-10 rounded-full border-2 border-brand-indigo/40 hover:border-brand-indigo transition-all overflow-hidden focus:outline-none focus:ring-2 focus:ring-brand-indigo shrink-0 flex items-center justify-center bg-surface min-h-[44px] min-w-[44px]"
        aria-label="User profile and menu"
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'User profile'}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        ) : (
          <UserIcon className="w-5 h-5 text-brand-indigo" />
        )}
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-surface shadow-xl border border-border-theme p-2 z-50 animate-in fade-in zoom-in-95 text-text-primary">
          <div className="p-3 border-b border-border-subtle mb-1">
            <div className="font-heading font-semibold text-sm truncate">
              {user.displayName || 'Signed In User'}
            </div>
            <div className="text-xs text-text-muted truncate">{user.email}</div>
          </div>

          <div className="space-y-0.5">
            <Link
              to="/saved"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-slate-200/50 dark:hover:bg-white/[0.06] transition-colors min-h-[44px]"
            >
              <Bookmark className="w-4 h-4 text-brand-indigo" />
              <span>Saved comparisons</span>
            </Link>

            <button
              onClick={() => {
                setDropdownOpen(false);
                signOutUser();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors min-h-[44px] text-left"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
