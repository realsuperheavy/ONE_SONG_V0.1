import { adminDb } from '../firebase/admin';
import { analyticsService } from '../firebase/services/analytics';
import type { RateLimit, RateLimitConfig } from '@/types/models';

export class RateLimitService {
  private readonly defaultConfig: RateLimitConfig = {
    request: {
      limit: 10,
      windowSeconds: 60 // 1 minute
    },
    search: {
      limit: 30,
      windowSeconds: 60 // 1 minute
    },
    attendee: {
      limit: 5,
      windowSeconds: 300 // 5 minutes
    }
  };

  constructor(
    private readonly db = adminDb,
    private readonly config: RateLimitConfig = defaultConfig
  ) {}

  async checkRateLimit(
    userId: string,
    resourceType: RateLimit['resourceType']
  ): Promise<boolean> {
    const rateLimitRef = this.db
      .collection('rate_limits')
      .doc(`${userId}_${resourceType}`);

    try {
      return await this.db.runTransaction(async (transaction) => {
        const doc = await transaction.get(rateLimitRef);
        const now = new Date();
        const config = this.config[resourceType];

        if (!doc.exists) {
          // First request, create new rate limit entry
          const rateLimit: RateLimit = {
            userId,
            resourceType,
            count: 1,
            window: {
              start: now,
              end: new Date(now.getTime() + config.windowSeconds * 1000)
            },
            limit: config.limit
          };
          transaction.set(rateLimitRef, rateLimit);
          return true;
        }

        const rateLimit = doc.data() as RateLimit;
        const windowEnd = rateLimit.window.end.toDate();

        if (now > windowEnd) {
          // Window expired, reset counter
          const newRateLimit: RateLimit = {
            ...rateLimit,
            count: 1,
            window: {
              start: now,
              end: new Date(now.getTime() + config.windowSeconds * 1000)
            }
          };
          transaction.set(rateLimitRef, newRateLimit);
          return true;
        }

        if (rateLimit.count >= config.limit) {
          // Rate limit exceeded
          analyticsService.trackEvent('rate_limit_exceeded', {
            userId,
            resourceType,
            currentCount: rateLimit.count,
            limit: config.limit
          });
          return false;
        }

        // Increment counter
        transaction.update(rateLimitRef, {
          count: rateLimit.count + 1
        });
        return true;
      });
    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'rate_limit_check',
        userId,
        resourceType
      });
      // Fail open if rate limiting fails
      return true;
    }
  }

  async getRateLimitStatus(
    userId: string,
    resourceType: RateLimit['resourceType']
  ): Promise<{
    remaining: number;
    resetAt: Date;
  }> {
    const doc = await this.db
      .collection('rate_limits')
      .doc(`${userId}_${resourceType}`)
      .get();

    if (!doc.exists) {
      return {
        remaining: this.config[resourceType].limit,
        resetAt: new Date(Date.now() + this.config[resourceType].windowSeconds * 1000)
      };
    }

    const rateLimit = doc.data() as RateLimit;
    const now = new Date();
    const windowEnd = rateLimit.window.end.toDate();

    if (now > windowEnd) {
      return {
        remaining: this.config[resourceType].limit,
        resetAt: new Date(now.getTime() + this.config[resourceType].windowSeconds * 1000)
      };
    }

    return {
      remaining: Math.max(0, this.config[resourceType].limit - rateLimit.count),
      resetAt: windowEnd
    };
  }

  async clearRateLimit(
    userId: string,
    resourceType: RateLimit['resourceType']
  ): Promise<void> {
    await this.db
      .collection('rate_limits')
      .doc(`${userId}_${resourceType}`)
      .delete();
  }
} 