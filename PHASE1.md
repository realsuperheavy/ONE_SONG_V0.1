## PHASE 1: FOUNDATION SETUP

### Step 1: Project Initialization
```bash
# Development Environment Setup
1. Create Next.js Project with TypeScript
   npx create-next-app@latest onesong --typescript --tailwind --eslint

2. Install Core Dependencies
   # Firebase packages
   npm install @firebase/app @firebase/auth @firebase/firestore @firebase/database
   npm install @firebase/storage @firebase/analytics

   # UI and State Management
   npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-slot
   npm install lucide-react
   
   # Data Fetching and State Management
   npm install axios @tanstack/react-query zustand

   # UI Components
   npx shadcn-ui@latest init

3. Configure Environment Variables
   # Create environment files
   touch .env.local
   touch .env.development
   touch .env.production

   # Add required variables to .env.local:
   NEXT_PUBLIC_FIREBASE_CONFIG_DEV='{
     "apiKey": "your-api-key",
     "authDomain": "your-auth-domain",
     "projectId": "your-project-id",
     "storageBucket": "your-storage-bucket",
     "messagingSenderId": "your-messaging-sender-id",
     "appId": "your-app-id",
     "measurementId": "your-measurement-id"
   }'
   NEXT_PUBLIC_SPOTIFY_CLIENT_ID_DEV="your-spotify-client-id"
```

### Step 2: Firebase Configuration
```typescript
// src/lib/firebase/config.ts

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
}

# Type-safe environment configuration
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

# Firebase initialization
import { initializeApp, getApps } from '@firebase/app';
import { getAuth } from '@firebase/auth';
import { getFirestore } from '@firebase/firestore';
import { getStorage } from '@firebase/storage';
import { getAnalytics } from '@firebase/analytics';

const firebaseConfig: FirebaseConfig = process.env.NODE_ENV === 'production'
  ? JSON.parse(ENV_MAP.production.firebase || '{}')
  : JSON.parse(ENV_MAP.development.firebase || '{}');

# Initialize Firebase only if it hasn't been initialized
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
```

### Step 3: Verify Setup
```bash
# Run development server
npm run dev

# Check console for any errors
# Visit http://localhost:3000