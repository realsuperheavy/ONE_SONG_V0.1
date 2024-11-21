import { RedisClient } from '../redis/client';
import { Logger } from '../utils/logger';
import type { RateLimitConfig, RateLimitStore } from '../../types/webhooks';

export class WebhookRateLimiter {
  private readonly logger = new Logger('RateLimiter');
  private readonly redis: RedisClient;

  constructor(
    private readonly config: RateLimitConfig = {
      windowMs: 60000,
      maxRequests: 100,
      blockDuration: 300000
    }
  ) {
    this.redis = new RedisClient();
  }

  async checkLimit(webhookId: string): Promise<void> {
    const key = `ratelimit:${webhookId}`;
    const current = await this.redis.incr(key);
    
    if (current === 1) {
      await this.redis.expire(key, Math.floor(this.config.windowMs / 1000));
    }

    if (current > this.config.maxRequests) {
      this.logger.warn('Rate limit exceeded', { webhookId, current });
      throw new Error('Rate limit exceeded');
    }
  }
} 