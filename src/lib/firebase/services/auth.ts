import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from '@firebase/auth';
import { doc, setDoc } from '@firebase/firestore';
import { auth, db } from '../config';
import { User } from '@/types/models';

export interface AuthError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface SignUpResult {
  user: FirebaseUser;
  profile: User;
  error?: AuthError;
}

export const authService = {
  signUp: async (
    email: string, 
    password: string, 
    userData: Partial<User>
  ): Promise<SignUpResult> => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      const profile: User = {
        id: user.uid,
        email: user.email!,
        type: userData.type || 'attendee',
        profile: {
          displayName: userData.profile?.displayName || email.split('@')[0],
          email: user.email!,
          photoURL: user.photoURL || null,
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
      };

      await setDoc(doc(db, 'users', user.uid), profile);

      return { user, profile };
    } catch (error) {
      throw error as AuthError;
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      return user;
    } catch (error) {
      throw error as AuthError;
    }
  },

  signOut: async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      throw error as AuthError;
    }
  },

  onAuthStateChanged: (callback: (user: FirebaseUser | null) => void) => {
    return onAuthStateChanged(auth, callback);
  }
}; 