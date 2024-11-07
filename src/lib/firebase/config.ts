import { initializeApp, getApps, FirebaseApp } from '@firebase/app';
import { getAuth } from '@firebase/auth';
import { getFirestore } from '@firebase/firestore';
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
};

// Parse the Firebase config from environment variable
const getFirebaseConfig = (): FirebaseConfig => {
  const env = process.env.NODE_ENV || 'development';
  const config = ENV_MAP[env as keyof typeof ENV_MAP].firebase;
  
  if (!config) {
    throw new Error(`Firebase configuration not found for environment: ${env}`);
  }

  try {
    return JSON.parse(config);
  } catch (error) {
    throw new Error('Invalid Firebase configuration format');
  }
};

// Initialize Firebase
let firebaseApp: FirebaseApp;

if (!getApps().length) {
  firebaseApp = initializeApp(getFirebaseConfig());
}

// Initialize Firebase services
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

// Initialize Analytics only in browser environment
const analytics = typeof window !== 'undefined' 
  ? isSupported().then(yes => yes ? getAnalytics(firebaseApp) : null) 
  : null;

export { auth, db, storage, analytics }; 