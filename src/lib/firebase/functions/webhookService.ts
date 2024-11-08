import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import { 
  getFirestore,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
  type DocumentData
} from 'firebase-admin/firestore';
import type { 
  WebhookEventType,
  WebhookConfig,
} from '@/types/webhooks';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  const serviceAccount = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID as string,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL as string,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') as string
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = getFirestore();

export class WebhookService {
  private async getActiveWebhooks(eventType: WebhookEventType): Promise<WebhookConfig[]> {
    const snapshot = await db
      .collection('webhooks')
      .where('enabled', '==', true)
      .where('events', 'array-contains', eventType)
      .get();

    return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data();
      return data as WebhookConfig;
    });
  }
}

// Export a singleton instance
export const webhookService = new WebhookService(); 