import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../config';

export const authService = {
  signIn: async (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  },
  
  signUp: async (email: string, password: string) => {
    return createUserWithEmailAndPassword(auth, email, password);
  },
  
  signOut: async () => {
    return firebaseSignOut(auth);
  },
  
  onAuthStateChanged: (callback: (user: any) => void) => {
    return onAuthStateChanged(auth, callback);
  }
}; 