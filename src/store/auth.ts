import { create } from 'zustand';
import { auth } from '@/lib/firebase/config';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';

interface User {
  id: string;
  email: string | null;
  profile: {
    displayName: string | null;
    photoURL: string | null;
  };
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,
  signIn: async (email: string, password: string) => {
    try {
      set({ loading: true, error: null });
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const { user: firebaseUser } = userCredential;
      
      set({
        user: {
          id: firebaseUser.uid,
          email: firebaseUser.email,
          profile: {
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL
          }
        },
        loading: false
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to sign in',
        loading: false 
      });
    }
  },
  signOut: async () => {
    try {
      await firebaseSignOut(auth);
      set({ user: null, error: null });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to sign out' 
      });
    }
  },
  setUser: (user) => set({ user }),
  setError: (error) => set({ error })
}));

// Initialize auth state listener
onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
  if (firebaseUser) {
    useAuthStore.getState().setUser({
      id: firebaseUser.uid,
      email: firebaseUser.email,
      profile: {
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL
      }
    });
  } else {
    useAuthStore.getState().setUser(null);
  }
  useAuthStore.setState({ loading: false });
}); 