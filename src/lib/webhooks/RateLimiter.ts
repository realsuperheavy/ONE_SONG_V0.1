import { Cache } from '@/lib/cache';
import { analyticsService } from '@/lib/firebase/services/analytics';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  webhookId: string;
}

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

export class WebhookRateLimiter {
  private buckets: Cache<TokenBucket>;
  private readonly CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour

  constructor() {
    this.buckets = new Cache({ maxSize: 1000, ttl: 24 * 60 * 60 * 1000 }); // 24 hours
    this.startCleanupInterval();
  }

  async checkLimit(config: RateLimitConfig): Promise<boolean> {
    const bucket = await this.getOrCreateBucket(config);
    this.refillBucket(bucket, config);

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      await this.updateBucket(config.webhookId, bucket);
      
      // Track successful request
      analyticsService.trackEvent('webhook_rate_limit', {
        webhookId: config.webhookId,
        remaining: bucket.tokens,
        allowed: true
      });

      return true;
    }

    // Track rate limit exceeded
    analyticsService.trackEvent('webhook_rate_limit_exceeded', {
      webhookId: config.webhookId,
      config: {
        maxRequests: config.maxRequests,
        windowMs: config.windowMs
      }
    });

    return false;
  }

  private async getOrCreateBucket(config: RateLimitConfig): Promise<TokenBucket> {
    const bucket = this.buckets.get(config.webhookId);
    
    if (bucket) {
      return bucket;
    }

    const newBucket: TokenBucket = {
      tokens: config.maxRequests,
      lastRefill: Date.now()
    };

    this.buckets.set(config.webhookId, newBucket);
    return newBucket;
  }

  private refillBucket(bucket: TokenBucket, config: RateLimitConfig): void {
    const now = Date.now();
    const timePassed = now - bucket.lastRefill;
    const tokensToAdd = Math.floor(timePassed / config.windowMs) * config.maxRequests;

    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(config.maxRequests, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
    }
  }

  private async updateBucket(webhookId: string, bucket: TokenBucket): Promise<void> {
    this.buckets.set(webhookId, bucket);
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      const now = Date.now();
      
      // Track cleanup metrics
      const beforeSize = this.buckets.size();
      
      this.buckets.cleanup();
      
      const afterSize = this.buckets.size();
      analyticsService.trackEvent('rate_limit_cleanup', {
        removedEntries: beforeSize - afterSize,
        remainingEntries: afterSize
      });
    }, this.CLEANUP_INTERVAL);
  }

  getStatus(webhookId: string): {
    remaining: number;
    resetTime: number;
  } | null {
    const bucket = this.buckets.get(webhookId);
    if (!bucket) return null;

    return {
      remaining: bucket.tokens,
      resetTime: bucket.lastRefill
    };
  }

  cleanup(): void {
    this.buckets.clear();
  }
} 