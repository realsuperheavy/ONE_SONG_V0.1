import * as admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import type {
  WebhookEventType,
  WebhookConfig,
  WebhookDeliveryStatus,
  WebhookMetrics,
} from '@/types/webhooks';
import crypto from 'crypto';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID as string,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL as string,
    privateKey: (process.env.FIREBASE_PRIVATE_KEY as string).replace(
      /\\n/g,
      '\n'
    ),
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = getFirestore();

export class WebhookService {
  /**
   * Gets all active webhooks for a given event type
   * @param eventType The type of event to get webhooks for
   * @returns Array of webhook configurations that are enabled and listening for this event
   */
  private async getActiveWebhooks(eventType: WebhookEventType): Promise<WebhookConfig[]> {
    const snapshot = await db
      .collection('webhooks')
      .where('enabled', '==', true)
      .where('events', 'array-contains', eventType)
      .get();

    return snapshot.docs.map((doc: QueryDocumentSnapshot) => {
      const data = doc.data() as WebhookConfig;
      return data;
    });
  }
}

// Export a singleton instance
export const webhookService = new WebhookService();