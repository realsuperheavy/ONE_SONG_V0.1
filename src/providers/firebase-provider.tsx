'use client';

import { createContext, useContext, useEffect, useState, PropsWithChildren } from 'react';
import { app, auth, db } from '@/lib/firebase/config';

const FirebaseContext = createContext<{
  initialized: boolean;
}>({ initialized: false });

export function FirebaseProvider({ children }: PropsWithChildren) {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized && app && auth && db) {
      setInitialized(true);
    }
  }, [initialized]);

  return (
    <FirebaseContext.Provider value={{ initialized }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export const useFirebase = () => useContext(FirebaseContext); 