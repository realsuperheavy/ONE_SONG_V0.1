import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import type { 
  Firestore,
  DocumentSnapshot,
  CollectionReference,
  Query,
} from 'firebase-admin/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import type { 
  WebhookEventType,
  WebhookEventPayload,
  WebhookConfig,
  WebhookDelivery,
  WebhookDeliveryStatus,
  WebhookMetrics,
} from '@/types/webhooks';
import crypto from 'crypto';

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

interface RetryDelivery extends WebhookDelivery {
  payload: {
    retryCount: number;
    [key: string]: unknown;
  };
}

export class WebhookService {
  private async getActiveWebhooks(eventType: WebhookEventType): Promise<WebhookConfig[]> {
    const snapshot = await db
      .collection('webhooks')
      .where('enabled', '==', true)
      .where('events', 'array-contains', eventType)
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return data as WebhookConfig;
    });
  }

  // Song-related webhooks
  async handleSongRequest(payload: WebhookEventPayload['song']['requested']): Promise<WebhookDeliveryStatus> {
    return this.deliverWebhook('song.requested', payload);
  }

  async handleSongApproval(payload: WebhookEventPayload['song']['approved']): Promise<WebhookDeliveryStatus> {
    return this.deliverWebhook('song.approved', payload);
  }

  async handleSongRejection(payload: WebhookEventPayload['song']['rejected']): Promise<WebhookDeliveryStatus> {
    return this.deliverWebhook('song.rejected', payload);
  }

  async handleSongPlayed(payload: WebhookEventPayload['song']['played']): Promise<WebhookDeliveryStatus> {
    return this.deliverWebhook('song.played', payload);
  }

  // Queue-related webhooks
  async handleQueueUpdate(payload: WebhookEventPayload['queue']['updated']): Promise<WebhookDeliveryStatus> {
    return this.deliverWebhook('queue.updated', payload);
  }

  // Event-related webhooks
  async handleEventStart(payload: WebhookEventPayload['event']['started']): Promise<WebhookDeliveryStatus> {
    return this.deliverWebhook('event.started', payload);
  }

  async handleEventEnd(payload: WebhookEventPayload['event']['ended']): Promise<WebhookDeliveryStatus> {
    return this.deliverWebhook('event.ended', payload);
  }

  // Tip-related webhooks
  async handleTipReceived(payload: WebhookEventPayload['tip']['received']): Promise<WebhookDeliveryStatus> {
    return this.deliverWebhook('tip.received', payload);
  }

  // User-related webhooks
  async handleUserJoined(payload: WebhookEventPayload['user']['joined']): Promise<WebhookDeliveryStatus> {
    return this.deliverWebhook('user.joined', payload);
  }

  async handleUserLeft(payload: WebhookEventPayload['user']['left']): Promise<WebhookDeliveryStatus> {
    return this.deliverWebhook('user.left', payload);
  }

  private async deliverWebhook(
    eventType: WebhookEventType,
    payload: unknown
  ): Promise<WebhookDeliveryStatus> {
    const webhooks = await this.getActiveWebhooks(eventType);
    const deliveryPromises = webhooks.map((webhook) => 
      this.deliverToSingleWebhook(webhook, eventType, payload),
    );

    const results = await Promise.all(deliveryPromises);
    const success = results.every((result) => result.success);

    return {
      success,
      statusCode: success ? 200 : 500,
      duration: Math.max(...results.map((r) => r.duration)),
      timestamp: Date.now(),
    };
  }

  private async deliverToSingleWebhook(
    webhook: WebhookConfig,
    eventType: WebhookEventType,
    payload: unknown
  ): Promise<WebhookDeliveryStatus> {
    const deliveryId = this.generateId();
    const startTime = Date.now();

    try {
      if (await this.isRateLimited(webhook)) {
        throw new Error("Rate limit exceeded");
      }

      const delivery: WebhookDelivery = {
        id: deliveryId,
        webhookId: webhook.id,
        eventType,
        payload,
        status: "success",
        timestamp: startTime,
        duration: 0,
      };

      await db.collection("webhook_deliveries")
        .doc(deliveryId)
        .set(delivery);

      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": this.generateSignature(payload, webhook.secret),
          "X-Webhook-ID": webhook.id,
          "X-Event-Type": eventType,
          "X-Delivery-ID": deliveryId,
        },
        body: JSON.stringify({
          eventType,
          payload,
          timestamp: startTime,
          deliveryId,
        }),
      });

      const duration = Date.now() - startTime;

      const status: WebhookDeliveryStatus = {
        success: response.ok,
        statusCode: response.status,
        duration,
        timestamp: Date.now(),
      };

      if (!response.ok) {
        status.error = `HTTP error! status: ${response.status}`;
        if (webhook.retryConfig) {
          await this.scheduleRetry(webhook, delivery as RetryDelivery);
        }
      }

      await this.updateMetrics(webhook.id, status);

      await db.collection("webhook_deliveries")
        .doc(deliveryId)
        .update({
          status: response.ok ? "success" : "failed",
          statusCode: response.status,
          duration,
          error: status.error,
        });

      return status;

    } catch (error) {
      const duration = Date.now() - startTime;
      const status: WebhookDeliveryStatus = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        duration,
        timestamp: Date.now(),
      };

      await this.updateMetrics(webhook.id, status);

      return status;
    }
  }

  private async isRateLimited(webhook: WebhookConfig): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - webhook.rateLimit.windowMs;

    const recentDeliveries = await db
      .collection('webhook_deliveries')
      .where('webhookId', '==', webhook.id)
      .where('timestamp', '>', windowStart)
      .count()
      .get();

    return recentDeliveries.data().count >= webhook.rateLimit.maxRequests;
  }

  private async updateMetrics(webhookId: string, status: WebhookDeliveryStatus): Promise<void> {
    const metricsRef = db.collection('webhook_metrics').doc(webhookId);
    
    await db.runTransaction(async (transaction: ReturnType<typeof db.runTransaction>) => {
      const doc = await transaction.get(metricsRef);
      const metrics = doc.data() as WebhookMetrics || {
        successRate: 0,
        averageLatency: 0,
        errorRate: 0,
        deliveryCount: 0
      };

      const newCount = metrics.deliveryCount + 1;
      const newLatency = (metrics.averageLatency * metrics.deliveryCount + status.duration) / newCount;
      const newSuccesses = metrics.successRate * metrics.deliveryCount + (status.success ? 1 : 0);
      
      transaction.set(metricsRef, {
        successRate: newSuccesses / newCount,
        averageLatency: newLatency,
        errorRate: 1 - (newSuccesses / newCount),
        deliveryCount: newCount
      });
    });
  }

  private async scheduleRetry(webhook: WebhookConfig, delivery: RetryDelivery): Promise<void> {
    const retryCount = (delivery.payload.retryCount || 0) + 1;
    if (webhook.retryConfig && retryCount <= webhook.retryConfig.maxAttempts) {
      const delay = webhook.retryConfig.initialDelay * 
        Math.pow(webhook.retryConfig.backoffMultiplier, retryCount - 1);
      
      await db.collection('webhook_retries').add({
        webhook,
        delivery: {
          ...delivery,
          payload: {
            ...delivery.payload,
            retryCount
          }
        },
        executeAt: Date.now() + delay
      });
    }
  }

  private generateSignature(payload: unknown, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }

  private generateId(): string {
    return db.collection('webhook_deliveries').doc().id;
  }
}

// Export a singleton instance
export const webhookService = new WebhookService(); 