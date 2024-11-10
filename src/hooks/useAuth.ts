import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { authService } from '@/lib/firebase/services/auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          type: 'attendee',
          profile: {
            displayName: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
            email: firebaseUser.email!,
            photoURL: firebaseUser.photoURL
          },
          settings: {
            theme: 'dark',
            notifications: true,
            language: 'en'
          },
          stats: {
            eventsCreated: 0,
            requestsMade: 0,
            tipsGiven: 0
          },
          createdAt: new Date().toISOString()
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  return children;
}

export const useAuth = () => {
  const { user, loading } = useAuthStore();

  return {
    user,
    loading,
    isAuthenticated: !!user,
    signIn: authService.signIn,
    signOut: authService.signOut,
    signUp: authService.signUp
  };
};