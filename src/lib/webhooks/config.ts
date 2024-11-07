import { getApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { analyticsService } from '../firebase/services/analytics';
import { WebhookEventType, WebhookEventPayload, WebhookConfig } from '@/types/webhooks';
import { Cache } from '@/lib/cache';

export class WebhookService {
  private functions;
  private configs: Map<string, WebhookConfig>;
  private deliveryCache: Cache<boolean>;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.functions = getFunctions(getApp());
    this.configs = new Map();
    this.deliveryCache = new Cache({ 
      maxSize: 1000, 
      ttl: this.CACHE_TTL 
    });
    this.initializeDefaultWebhooks();
  }

  registerWebhook(name: string, config: Omit<WebhookConfig, 'id' | 'createdAt' | 'updatedAt'>): void {
    if (!config.url || !config.secret) {
      throw new Error('Invalid webhook configuration: url and secret are required');
    }

    const webhookId = `webhook_${Date.now()}`;
    const fullConfig: WebhookConfig = {
      id: webhookId,
      name,
      url: config.url,
      secret: config.secret,
      enabled: config.enabled ?? true,
      events: config.events || [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      rateLimit: {
        maxRequests: config.rateLimit?.maxRequests || 100,
        windowMs: config.rateLimit?.windowMs || 60000
      }
    };

    this.configs.set(name, fullConfig);

    analyticsService.trackEvent('webhook_registered', {
      webhookId,
      name,
      events: fullConfig.events
    });
  }

  async triggerWebhook(
    name: string, 
    eventType: WebhookEventType, 
    data: any
  ): Promise<void> {
    const config = this.configs.get(name);
    if (!config) {
      throw new Error(`Webhook ${name} not found`);
    }

    if (!config.enabled) {
      return;
    }

    if (!config.events.includes(eventType)) {
      return;
    }

    const deliveryId = `${name}_${eventType}_${Date.now()}`;
    if (this.deliveryCache.get(deliveryId)) {
      analyticsService.trackEvent('webhook_duplicate_prevented', {
        webhookId: config.id,
        deliveryId
      });
      return;
    }

    const payload: Omit<WebhookEventPayload, 'signature'> = {
      eventType,
      data,
      timestamp: Date.now()
    };

    let attempt = 0;
    while (attempt < this.MAX_RETRIES) {
      try {
        const signature = this.generateSignature(payload, config.secret);
        const deliverWebhook = httpsCallable(this.functions, 'deliverWebhook');
        
        await deliverWebhook({
          url: config.url,
          payload,
          signature,
          deliveryId,
          webhookId: config.id
        });

        this.deliveryCache.set(deliveryId, true);
        
        analyticsService.trackEvent('webhook_delivered', {
          webhookId: config.id,
          eventType,
          attempt: attempt + 1
        });

        return;
      } catch (error) {
        attempt++;
        analyticsService.trackEvent('webhook_delivery_failed', {
          webhookId: config.id,
          eventType,
          attempt,
          error: error.message
        });

        if (attempt === this.MAX_RETRIES) {
          throw new Error(`Webhook ${name} delivery failed after ${attempt} attempts: ${error.message}`);
        }

        await new Promise(resolve => 
          setTimeout(resolve, this.RETRY_DELAY * Math.pow(2, attempt))
        );
      }
    }
  }

  getWebhookConfig(name: string): WebhookConfig | undefined {
    return this.configs.get(name);
  }

  updateWebhookConfig(name: string, updates: Partial<WebhookConfig>): void {
    const config = this.configs.get(name);
    if (!config) {
      throw new Error(`Webhook ${name} not found`);
    }

    this.configs.set(name, {
      ...config,
      ...updates,
      updatedAt: Date.now()
    });

    analyticsService.trackEvent('webhook_updated', {
      webhookId: config.id,
      updates: Object.keys(updates)
    });
  }

  deleteWebhook(name: string): void {
    const config = this.configs.get(name);
    if (!config) return;

    this.configs.delete(name);

    analyticsService.trackEvent('webhook_deleted', {
      webhookId: config.id
    });
  }

  private generateSignature(payload: any, secret: string): string {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }

  private initializeDefaultWebhooks(): void {
    // Register system webhooks
    this.registerWebhook('system_health', {
      url: process.env.NEXT_PUBLIC_SYSTEM_HEALTH_WEBHOOK_URL!,
      secret: process.env.NEXT_PUBLIC_SYSTEM_HEALTH_WEBHOOK_SECRET!,
      events: ['event.started', 'event.ended'],
      rateLimit: {
        maxRequests: 10,
        windowMs: 60000
      }
    });

    this.registerWebhook('analytics', {
      url: process.env.NEXT_PUBLIC_ANALYTICS_WEBHOOK_URL!,
      secret: process.env.NEXT_PUBLIC_ANALYTICS_WEBHOOK_SECRET!,
      events: ['song.played', 'tip.received'],
      rateLimit: {
        maxRequests: 1000,
        windowMs: 60000
      }
    });
  }

  cleanup(): void {
    this.configs.clear();
    this.deliveryCache.clear();
  }
}

export const webhookService = new WebhookService();
  