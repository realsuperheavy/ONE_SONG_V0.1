import { initializeApp, getApps } from '@firebase/app';
import { getAuth } from '@firebase/auth';
import { getFirestore } from '@firebase/firestore/lite';
import { getStorage } from '@firebase/storage';
import { getAnalytics, isSupported } from '@firebase/analytics';

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
}

const ENV_MAP = {
  development: {
    firebase: process.env.NEXT_PUBLIC_FIREBASE_CONFIG_DEV,
    spotify: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID_DEV
  },
  production: {
    firebase: process.env.NEXT_PUBLIC_FIREBASE_CONFIG_PROD,
    spotify: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID_PROD
  }
} as const;

const firebaseConfig: FirebaseConfig = process.env.NODE_ENV === 'production'
  ? JSON.parse(ENV_MAP.production.firebase || '{}')
  : JSON.parse(ENV_MAP.development.firebase || '{}');

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export let analytics = null;

if (typeof window !== 'undefined') {
  isSupported().then(yes => {
    if (yes) {
      analytics = getAnalytics(app) as any; // Type assertion to avoid type error
    }
  });
}

export default app;