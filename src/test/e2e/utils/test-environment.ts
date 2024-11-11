import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

interface TestEnvironment {
  projectId: string;
  firestore: FirebaseFirestore;
  auth: Auth;
  cleanup: () => Promise<void>;
}

export async function initializeTestEnvironment(): Promise<TestEnvironment> {
  const projectId = `test-${Date.now()}`;
  
  // Initialize test environment
  const testEnv = await initializeTestEnvironment({
    projectId,
    firestore: { host: 'localhost', port: 8080 },
    auth: { host: 'localhost', port: 9099 }
  });

  // Connect to emulators
  const firestore = getFirestore();
  const auth = getAuth();
  
  if (process.env.NODE_ENV === 'test') {
    connectFirestoreEmulator(firestore, 'localhost', 8080);
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  }

  return {
    projectId,
    firestore,
    auth,
    cleanup: async () => {
      await testEnv.cleanup();
      await Promise.all([
        firestore.terminate(),
        auth.signOut()
      ]);
    }
  };
}

export async function generateTestData(env: TestEnvironment) {
  const { firestore } = env;
  
  // Create test collections
  await Promise.all([
    firestore.collection('users').add({
      role: 'dj',
      email: 'test@dj.com',
      createdAt: new Date()
    }),
    firestore.collection('events').add({
      name: 'Test Event',
      status: 'active',
      createdAt: new Date()
    })
  ]);
} 