import { initializeApp, getApps } from '@firebase/app';
import { getAuth, connectAuthEmulator } from '@firebase/auth';
import { getFirestore, connectFirestoreEmulator } from '@firebase/firestore';
import { getStorage } from '@firebase/storage';
import { getAnalytics } from '@firebase/analytics';

const firebaseConfig = process.env.NODE_ENV === 'production'
  ? JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG_PROD || '{}')
  : JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG_DEV || '{}');

// Initialize Firebase only if it hasn't been initialized
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Connect to emulators in development
if (process.env.NODE_ENV === 'development') {
  const auth = getAuth(app);
  const db = getFirestore(app);
  
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;