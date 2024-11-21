import type { 
  WebhookConfig, 
  WebhookPayload, 
  WebhookLogEntry, 
  WebhookResponse,
  WebhookError
} from '../../types/webhooks';
import { MetricsClient } from '../metrics/client';
import { RateLimiter } from './ratelimit';
import { CircuitBreaker } from '../utils/circuit-breaker';
import { WebhookValidator } from './validation';
import { WebhookMonitoring } from './monitoring';
import { DistributedLock } from '../utils/distributed-lock';
import { Logger } from '../utils/logger';
import axios, { AxiosResponse } from 'axios';
import * as crypto from 'crypto';

export class WebhookService {
  private readonly validator: WebhookValidator;
  private readonly monitoring: WebhookMonitoring;
  
  constructor(
    private readonly metricsClient = new MetricsClient('webhooks'),
    private readonly rateLimiter = new RateLimiter(),
    private readonly circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeout: 30000,
      halfOpenRequests: 3
    }),
    private readonly lockManager = new DistributedLock('webhooks'),
    private readonly logger = new Logger('WebhookService')
  ) {
    this.validator = new WebhookValidator();
    this.monitoring = new WebhookMonitoring();
  }

  async deliverWebhook(
    webhookId: string, 
    payload: WebhookPayload,
    attempt = 1
  ): Promise<WebhookResponse> {
    const startTime = Date.now();
    const lockKey = `webhook:${webhookId}:${payload.id}`;

    return this.lockManager.withLock(lockKey, async () => {
      try {
        // Comprehensive validation and delivery
        await this.rateLimiter.checkLimit(webhookId);
        await this.circuitBreaker.checkState(webhookId);
        
        const webhook = await this.getWebhookConfig(webhookId);
        if (!webhook?.active) {
          throw new WebhookError('Webhook not found or inactive', 'INVALID_STATE', 404);
        }

        await this.validator.validatePayload(webhook, payload);
        const response = await this.sendWithRetry(webhook, payload, attempt);

        await this.monitoring.trackDelivery({
          webhookId,
          success: true,
          duration: Date.now() - startTime,
          attempt,
          payload
        });

        return response;
      } catch (error) {
        this.logger.error('Webhook delivery failed', { webhookId, error });
        await this.monitoring.trackDelivery({
          webhookId,
          success: false,
          error: error.message,
          duration: Date.now() - startTime,
          attempt
        });
        throw error;
      }
    });
  }

  private async sendWithRetry(
    webhook: WebhookConfig,
    payload: WebhookPayload,
    attempt: number
  ): Promise<WebhookResponse> {
    try {
      const response = await this.sendWebhookRequest(webhook, payload);
      return this.formatResponse(response);
    } catch (error) {
      if (this.shouldRetry(error, attempt)) {
        await this.delay(attempt);
        return this.deliverWebhook(webhook.id, payload, attempt + 1);
      }
      throw error;
    }
  }
} 