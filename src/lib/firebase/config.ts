import { initializeApp, getApps } from '@firebase/app';
import { getAuth } from '@firebase/auth';
import { getFirestore } from '@firebase/firestore/lite';
import { getStorage } from '@firebase/storage';
import { getAnalytics, isSupported, Analytics } from '@firebase/analytics';

// Only import admin in server context
let adminApp = null;
if (typeof window === 'undefined') {
  const admin = require('firebase-admin');
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'
  );
  
  adminApp = !admin.apps.length 
    ? admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      })
    : admin.apps[0];
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

const firebaseConfig = process.env.NODE_ENV === 'production'
  ? JSON.parse(ENV_MAP.production.firebase || '{}')
  : JSON.parse(ENV_MAP.development.firebase || '{}');

// Client-side Firebase initialization
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export let analytics: Analytics | null = null;

if (typeof window !== 'undefined') {
  isSupported().then(yes => {
    if (yes) {
      analytics = getAnalytics(app);
    }
  });
}

export { adminApp };
export default app;