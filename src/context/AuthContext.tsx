import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, testFirestoreConnection } from '../lib/firebase';
import { toast } from '../store/useToastStore';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testFirestoreConnection();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast('Signed in successfully with Google', 'success');
    } catch (error: any) {
      console.error('Sign-in error:', error);
      if (error?.code === 'auth/popup-closed-by-user') {
        // User intentionally cancelled the popup
        return;
      }
      if (error?.code === 'auth/popup-blocked') {
        toast('Popup blocked by browser. Please allow popups for this window.', 'warning');
        return;
      }
      if (error?.code === 'auth/unauthorized-domain') {
        const domain = typeof window !== 'undefined' ? window.location.hostname : 'this domain';
        toast(`Domain ${domain} not authorized in Firebase Authentication.`, 'error');
        return;
      }
      toast(error?.message || 'Failed to sign in with Google', 'error');
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
      toast('Signed out', 'info');
    } catch (error: any) {
      console.error('Sign-out error:', error);
      toast('Failed to sign out', 'error');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
