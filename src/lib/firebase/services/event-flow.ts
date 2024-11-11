import { adminDb } from '../admin';
import { RateLimitService } from './rate-limit';
import { AppError } from '@/lib/error/AppError';
import type { Event, SongRequest } from '@/types/models';
import { analyticsService } from './analytics';
import { Timestamp } from 'firebase-admin/firestore';

export class EventFlowService {
  private rateLimiter: RateLimitService;

  constructor(private readonly db = adminDb) {
    this.rateLimiter = new RateLimitService();
  }

  async createEventRequest(eventId: string, userId: string, request: Partial<SongRequest>): Promise<void> {
    const canProceed = await this.rateLimiter.checkRateLimit(userId, 'request');
    if (!canProceed) {
      throw new AppError({
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Request limit exceeded',
        context: { eventId, userId }
      });
    }

    return this.db.runTransaction(async (transaction) => {
      // Get event doc
      const eventRef = this.db.collection('events').doc(eventId);
      const eventDoc = await transaction.get(eventRef);

      if (!eventDoc.exists) {
        throw new AppError({
          code: 'NOT_FOUND',
          message: 'Event not found',
          context: { eventId }
        });
      }

      const event = eventDoc.data() as Event;

      // Check event status
      if (event.status !== 'active') {
        throw new AppError({
          code: 'INVALID_REQUEST',
          message: 'Event is not active',
          context: { eventId, status: event.status }
        });
      }

      // Create request
      const requestRef = this.db.collection('requests').doc();
      const requestData: SongRequest = {
        id: requestRef.id,
        eventId,
        userId,
        song: request.song!,
        status: event.settings.requireApproval ? 'pending' : 'approved',
        metadata: {
          requestTime: Date.now(),
          votes: 0,
          ...request.metadata
        }
      };

      // Update event stats
      transaction.update(eventRef, {
        'stats.requestCount': event.stats.requestCount + 1,
        updatedAt: Timestamp.now()
      });

      // Save request
      transaction.set(requestRef, requestData);

      // Track analytics
      analyticsService.trackEvent('request_created', {
        eventId,
        userId,
        requestId: requestRef.id,
        songId: request.song?.id
      });
    });
  }

  async getEventRequests(eventId: string, options: {
    status?: SongRequest['status'];
    limit?: number;
    orderBy?: 'votes' | 'requestTime';
  } = {}): Promise<SongRequest[]> {
    try {
      let query = this.db
        .collection('requests')
        .where('eventId', '==', eventId);

      if (options.status) {
        query = query.where('status', '==', options.status);
      }

      if (options.orderBy) {
        const orderByField = options.orderBy === 'votes' 
          ? 'metadata.votes' 
          : 'metadata.requestTime';
        query = query.orderBy(orderByField, 'desc');
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SongRequest));
    } catch (error) {
      throw new AppError({
        code: 'OPERATION_FAILED',
        message: 'Failed to fetch requests',
        context: { eventId, error: (error as Error).message }
      });
    }
  }
} 