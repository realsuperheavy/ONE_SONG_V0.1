import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { Analytics, getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase services
const app = getApps()[0] || initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
const rtdb = getDatabase(app);

// Initialize analytics with proper type handling
let analyticsInstance: Analytics | undefined;

const initializeAnalytics = async (): Promise<Analytics | undefined> => {
  if (typeof window !== 'undefined' && await isSupported()) {
    analyticsInstance = getAnalytics(app);
    return analyticsInstance;
  }
  return undefined;
};

export {
  app,
  auth,
  firestore,
  rtdb,
  initializeAnalytics,
  analyticsInstance as analytics
};

export default app;