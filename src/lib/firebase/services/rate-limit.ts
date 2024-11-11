import { adminDb } from '../admin';
import { analyticsService } from './analytics';
import type { RateLimit, RateLimitConfig } from '@/types/models';
import { 
  DocumentReference, 
  FirebaseFirestore, 
  Transaction,
  FieldValue,
  getFirestore 
} from 'firebase-admin/firestore';
import { AppError } from '@/lib/error/AppError';
import * as admin from 'firebase-admin';

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
    },
    subscription: {
      limit: 5,
      windowSeconds: 60 // 1 minute
    }
  };

  constructor(
    private readonly db: FirebaseFirestore = getFirestore(),
    private readonly config: RateLimitConfig = this.defaultConfig
  ) {}

  private getRateLimitRef(userId: string, resourceType: RateLimit['resourceType']): DocumentReference<RateLimit> {
    return this.db
      .collection('rate_limits')
      .doc(`${userId}_${resourceType}`) as DocumentReference<RateLimit>;
  }

  async checkRateLimit(
    userId: string,
    resourceType: RateLimit['resourceType']
  ): Promise<boolean> {
    const rateLimitRef = this.getRateLimitRef(userId, resourceType);

    try {
      return await this.db.runTransaction(async (transaction: Transaction) => {
        const doc = await transaction.get(rateLimitRef);
        const now = admin.firestore.Timestamp.now();
        const config = this.config[resourceType];

        if (!doc.exists) {
          const rateLimit: RateLimit = {
            userId,
            resourceType,
            count: 1,
            window: {
              start: now,
              end: admin.firestore.Timestamp.fromMillis(Date.now() + config.windowSeconds * 1000)
            },
            limit: config.limit
          };
          transaction.set(rateLimitRef, rateLimit);
          return true;
        }

        const rateLimit = doc.data() as RateLimit;
        const windowEnd = rateLimit.window.end;

        if (now.seconds > windowEnd.seconds) {
          const newRateLimit: RateLimit = {
            ...rateLimit,
            count: 1,
            window: {
              start: now,
              end: admin.firestore.Timestamp.fromMillis(Date.now() + config.windowSeconds * 1000)
            }
          };
          transaction.set(rateLimitRef, newRateLimit);
          return true;
        }

        if (rateLimit.count >= config.limit) {
          analyticsService.trackEvent('rate_limit_exceeded', {
            userId,
            resourceType,
            currentCount: rateLimit.count,
            limit: config.limit,
            windowEnd: windowEnd.toDate()
          });
          return false;
        }

        analyticsService.trackEvent('rate_limit_check', {
          userId,
          resourceType,
          currentCount: rateLimit.count + 1,
          limit: config.limit
        });

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
      throw new AppError({
        code: 'OPERATION_FAILED',
        message: 'Rate limit check failed',
        context: { userId, resourceType, error: (error as Error).message }
      });
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
    const now = admin.firestore.Timestamp.fromDate(new Date());
    const windowEnd = rateLimit.window.end;

    if (now.toDate().getTime() > windowEnd.toDate().getTime()) {
      return {
        remaining: this.config[resourceType].limit,
        resetAt: new Date((now.toDate().getTime() + this.config[resourceType].windowSeconds * 1000))
      };
    }

    return {
      remaining: Math.max(0, this.config[resourceType].limit - rateLimit.count),
      resetAt: windowEnd.toDate()
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

  async checkSubscriptionLimit(userId: string, eventId: string): Promise<boolean> {
    const rateLimitRef = this.db
      .collection('rate_limits')
      .doc(`${userId}_subscription_${eventId}`);

    return this.db.runTransaction(async transaction => {
      const doc = await transaction.get(rateLimitRef);
      const now = admin.firestore.Timestamp.now();
      
      if (!doc.exists) {
        transaction.set(rateLimitRef, {
          userId,
          resourceType: 'subscription',
          count: 1,
          window: {
            start: now,
            end: admin.firestore.Timestamp.fromMillis(Date.now() + this.config.subscription.windowSeconds * 1000)
          },
          limit: this.config.subscription.limit
        });
        return true;
      }

      const rateLimit = doc.data() as RateLimit;
      if (now.toMillis() > rateLimit.window.end.toMillis()) {
        // Reset window
        transaction.update(rateLimitRef, {
          count: 1,
          window: {
            start: now,
            end: admin.firestore.Timestamp.fromMillis(Date.now() + this.config.subscription.windowSeconds * 1000)
          }
        });
        return true;
      }

      if (rateLimit.count >= this.config.subscription.limit) {
        return false;
      }

      transaction.update(rateLimitRef, {
        count: rateLimit.count + 1
      });
      return true;
    });
  }
} 