import { adminDb } from '../firebase/admin';
import { logger } from '../utils/logger';
import axios from 'axios';
import * as crypto from 'crypto';
import type { WebhookConfig, WebhookPayload, WebhookLogEntry } from './types';

export class WebhookService {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAYS = [1000, 5000, 15000]; // ms

  constructor(private readonly db = adminDb) {}

  async deliverWebhook(
    webhookId: string,
    payload: WebhookPayload,
    attempt = 1
  ): Promise<void> {
    const webhook = await this.getWebhookConfig(webhookId);
    if (!webhook || !webhook.enabled) return;

    try {
      const response = await this.sendWebhookRequest(webhook, payload);
      await this.logWebhookDelivery(webhookId, {
        success: true,
        statusCode: response.status,
        attempt,
        timestamp: new Date()
      });
    } catch (error) {
      const shouldRetry = attempt < WebhookService.MAX_RETRIES;
      await this.logWebhookDelivery(webhookId, {
        success: false,
        error: error.message,
        attempt,
        timestamp: new Date()
      });

      if (shouldRetry) {
        const delay = WebhookService.RETRY_DELAYS[attempt - 1];
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.deliverWebhook(webhookId, payload, attempt + 1);
      }

      throw error;
    }
  }

  private async getWebhookConfig(webhookId: string): Promise<WebhookConfig | null> {
    const doc = await this.db.collection('webhooks').doc(webhookId).get();
    return doc.exists ? (doc.data() as WebhookConfig) : null;
  }

  private async logWebhookDelivery(webhookId: string, details: Partial<WebhookLogEntry>): Promise<void> {
    await this.db.collection('webhook_logs').add({
      webhookId,
      ...details,
      timestamp: new Date()
    });
  }

  private async sendWebhookRequest(
    webhook: WebhookConfig,
    payload: WebhookPayload
  ) {
    const signature = this.generateSignature(payload, webhook.secret);
    
    return axios.post(webhook.url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
      },
      timeout: webhook.timeout || 5000,
    });
  }

  private generateSignature(payload: WebhookPayload, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    return hmac.update(JSON.stringify(payload)).digest('hex');
  }
} 