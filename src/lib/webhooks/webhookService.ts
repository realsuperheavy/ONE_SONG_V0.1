import * as admin from 'firebase-admin';
import type { WebhookConfig, WebhookEventType } from './types';
import crypto from 'crypto';

const db = admin.firestore();

export class WebhookService {
  private async getActiveWebhooks(eventType: WebhookEventType): Promise<WebhookConfig[]> {
    const snapshot = await db
      .collection('webhooks')
      .where('enabled', '==', true)
      .where('events', 'array-contains', eventType)
      .get();

    return snapshot.docs.map((doc) => doc.data() as WebhookConfig);
  }

  public async triggerWebhooks(eventType: WebhookEventType, data: unknown): Promise<void> {
    const webhooks = await this.getActiveWebhooks(eventType);

    for (const webhook of webhooks) {
      const payload = {
        eventType,
        data,
        timestamp: Date.now(),
      };

      const signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(JSON.stringify(payload))
        .digest('hex');

      await this.sendWebhook(webhook.url, { ...payload, signature });
    }
  }

  private async sendWebhook(url: string, payload: object): Promise<void> {
    // Implement the HTTP request to send the webhook payload
  }
}

export const webhookService = new WebhookService(); 