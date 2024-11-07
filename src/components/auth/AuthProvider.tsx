import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { authService } from '@/lib/firebase/services/auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        // Convert Firebase user to our User type
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          profile: {
            displayName: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
            email: firebaseUser.email!,
            photoURL: firebaseUser.photoURL
          }
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  return <>{children}</>;
} 