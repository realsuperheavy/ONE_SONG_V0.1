import { initializeTestEnvironment as initFirebaseTest } from '@firebase/rules-unit-testing';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectAuthEmulator, getAuth } from 'firebase/auth';

interface TestEnvironment {
  projectId: string;
  firestore: any;
  auth: any;
  cleanup: () => Promise<void>;
}

export async function initializeTestEnvironment(): Promise<TestEnvironment> {
  const projectId = `test-${Date.now()}`;
  
  // Initialize test environment with emulators
  const testEnv = await initFirebaseTest({
    projectId,
    firestore: {
      host: 'localhost',
      port: 8080
    },
    auth: {
      host: 'localhost',
      port: 9099
    }
  });

  // Connect to emulators
  const firestore = getFirestore();
  const auth = getAuth();
  
  connectFirestoreEmulator(firestore, 'localhost', 8080);
  connectAuthEmulator(auth, 'http://localhost:9099');

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