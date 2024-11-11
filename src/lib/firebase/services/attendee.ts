import { adminDb } from '../admin';
import { AppError } from '@/lib/error/AppError';
import { analyticsService } from './analytics';
import type { AttendeeSession, Event } from '@/types/models';
import { Timestamp } from 'firebase-admin/firestore';
import { RateLimitService } from './rate-limit';
import { productionMonitor } from '@/lib/monitoring/ProductionMonitor';

export class AttendeeManagementService {
  private rateLimitService: RateLimitService;

  constructor(
    private readonly db = adminDb,
    rateLimitService?: RateLimitService
  ) {
    this.rateLimitService = rateLimitService || new RateLimitService();
  }

  async joinEvent(eventId: string, userId: string): Promise<void> {
    return this.db.runTransaction(async transaction => {
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
      if (event.status !== 'active') {
        throw new AppError({
          code: 'INVALID_REQUEST',
          message: 'Event is not active',
          context: { eventId, status: event.status }
        });
      }

      const attendeeRef = this.db
        .collection('events')
        .doc(eventId)
        .collection('attendees')
        .doc(userId);

      const attendeeSession: AttendeeSession = {
        userId,
        eventId,
        status: 'active',
        joinedAt: Timestamp.now(),
        lastActiveAt: Timestamp.now(),
        metadata: {
          requestCount: 0,
          totalTips: 0
        }
      };

      transaction.set(attendeeRef, attendeeSession, { merge: true });
      transaction.update(eventRef, {
        'stats.attendeeCount': event.stats.attendeeCount + 1,
        'metadata.updatedAt': Timestamp.now()
      });

      analyticsService.trackEvent('attendee_joined', {
        eventId,
        userId,
        timestamp: Date.now()
      });
    });
  }

  async updateAttendeeStatus(
    eventId: string,
    userId: string,
    status: AttendeeSession['status']
  ): Promise<void> {
    const attendeeRef = this.db
      .collection('events')
      .doc(eventId)
      .collection('attendees')
      .doc(userId);

    await attendeeRef.update({
      status,
      'metadata.lastStatusChange': Timestamp.now(),
      lastActiveAt: Timestamp.now()
    });

    analyticsService.trackEvent('attendee_status_updated', {
      eventId,
      userId,
      status,
      timestamp: Date.now()
    });
  }

  async getEventAttendees(
    eventId: string,
    options: {
      status?: AttendeeSession['status'];
      limit?: number;
      orderBy?: 'joinedAt' | 'lastActiveAt';
    } = {}
  ): Promise<AttendeeSession[]> {
    let query = this.db
      .collection('events')
      .doc(eventId)
      .collection('attendees');

    if (options.status) {
      query = query.where('status', '==', options.status);
    }

    if (options.orderBy) {
      query = query.orderBy(options.orderBy, 'desc');
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({
      ...doc.data()
    } as AttendeeSession));
  }

  async updateAttendeeMetadata(
    eventId: string,
    userId: string,
    updates: Partial<AttendeeSession['metadata']>
  ): Promise<void> {
    const attendeeRef = this.db
      .collection('events')
      .doc(eventId)
      .collection('attendees')
      .doc(userId);

    await attendeeRef.update({
      metadata: updates,
      lastActiveAt: Timestamp.now()
    });
  }

  async removeAttendee(eventId: string, userId: string): Promise<void> {
    return this.db.runTransaction(async transaction => {
      const eventRef = this.db.collection('events').doc(eventId);
      const attendeeRef = eventRef.collection('attendees').doc(userId);

      const [eventDoc, attendeeDoc] = await Promise.all([
        transaction.get(eventRef),
        transaction.get(attendeeRef)
      ]);

      if (!eventDoc.exists) {
        throw new AppError({
          code: 'NOT_FOUND',
          message: 'Event not found',
          context: { eventId }
        });
      }

      if (!attendeeDoc.exists) {
        throw new AppError({
          code: 'NOT_FOUND',
          message: 'Attendee not found',
          context: { eventId, userId }
        });
      }

      const event = eventDoc.data() as Event;

      transaction.delete(attendeeRef);
      transaction.update(eventRef, {
        'stats.attendeeCount': Math.max(0, event.stats.attendeeCount - 1),
        'metadata.updatedAt': Timestamp.now()
      });

      analyticsService.trackEvent('attendee_removed', {
        eventId,
        userId,
        timestamp: Date.now()
      });
    });
  }

  async subscribeToAttendeeUpdates(
    eventId: string,
    userId: string,
    callback: (attendees: AttendeeSession[]) => void
  ): Promise<() => void> {
    const startTime = Date.now();
    
    try {
      const canSubscribe = await this.rateLimitService.checkSubscriptionLimit(userId, eventId);
      if (!canSubscribe) {
        throw new AppError({
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Subscription rate limit exceeded',
          context: { eventId, userId }
        });
      }

      const attendeesRef = this.db
        .collection('events')
        .doc(eventId)
        .collection('attendees');

      const unsubscribe = attendeesRef
        .orderBy('lastActiveAt', 'desc')
        .onSnapshot(
          (snapshot) => {
            const attendees = snapshot.docs.map(doc => ({
              ...doc.data()
            } as AttendeeSession));
            callback(attendees);
            
            // Track performance
            productionMonitor.trackPerformance({
              name: 'attendee_subscription_update',
              duration: Date.now() - startTime,
              metadata: {
                eventId,
                userId,
                attendeeCount: attendees.length
              }
            });
          },
          (error) => {
            console.error('Error in attendee subscription:', error);
            productionMonitor.trackError({
              error,
              context: {
                type: 'attendee_subscription',
                eventId,
                userId
              },
              severity: 'high'
            });
          }
        );

      return () => {
        unsubscribe();
        productionMonitor.trackEvent('attendee_subscription_ended', {
          eventId,
          userId,
          duration: Date.now() - startTime
        });
      };
    } catch (error) {
      productionMonitor.trackError({
        error: error as Error,
        context: {
          type: 'attendee_subscription_setup',
          eventId,
          userId
        },
        severity: 'high'
      });
      throw error;
    }
  }

  async updateAttendeePresence(eventId: string, userId: string): Promise<void> {
    const attendeeRef = this.db
      .collection('events')
      .doc(eventId)
      .collection('attendees')
      .doc(userId);

    await attendeeRef.update({
      lastActiveAt: Timestamp.now(),
      'metadata.lastPresenceUpdate': Timestamp.now()
    });
  }
} 