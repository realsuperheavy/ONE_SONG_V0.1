import { createContext, useContext, ReactNode } from 'react';
import { Auth } from '@firebase/auth';
import { Firestore } from '@firebase/firestore';
import { Storage } from '@firebase/storage';
import { auth, db, storage } from './config';

interface FirebaseContextType {
  auth: Auth;
  db: Firestore;
  storage: Storage;
}

const FirebaseContext = createContext<FirebaseContextType | null>(null);

export function FirebaseProvider({ children }: { children: ReactNode }) {
  return (
    <FirebaseContext.Provider value={{ auth, db, storage }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
} 