import { adminDb } from '../admin';
import { RateLimitService } from './rate-limit';
import { AppError } from '@/lib/error/AppError';
import type { Event, QueueItem, SongRequest } from '@/types/models';
import { analyticsService } from './analytics';
import { Timestamp } from 'firebase-admin/firestore';

export class EventManagementService {
  private rateLimiter: RateLimitService;

  constructor(private readonly db = adminDb) {
    this.rateLimiter = new RateLimitService();
  }

  async createEvent(djId: string, eventData: Partial<Event>): Promise<Event> {
    const eventRef = this.db.collection('events').doc();
    
    const event: Event = {
      id: eventRef.id,
      djId,
      status: 'scheduled',
      settings: {
        allowTips: true,
        requireApproval: true,
        maxQueueSize: 50,
        blacklistedGenres: []
      },
      stats: {
        attendeeCount: 0,
        requestCount: 0,
        totalTips: 0
      },
      metadata: {
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      details: {
        name: eventData.details?.name || 'Untitled Event'
      },
      ...eventData
    };

    await eventRef.set(event);
    analyticsService.trackEvent('event_created', { eventId: event.id, djId });
    
    return event;
  }

  async updateEventStatus(eventId: string, status: Event['status']): Promise<void> {
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

      transaction.update(eventRef, {
        status,
        'metadata.updatedAt': Timestamp.now(),
        ...(status === 'active' ? { 'metadata.startedAt': Timestamp.now() } : {}),
        ...(status === 'ended' ? { 'metadata.endedAt': Timestamp.now() } : {})
      });

      analyticsService.trackEvent('event_status_updated', {
        eventId,
        status
      });
    });
  }

  async getEventQueue(eventId: string): Promise<QueueItem[]> {
    const snapshot = await this.db
      .collection('queue')
      .where('eventId', '==', eventId)
      .orderBy('position')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as QueueItem));
  }

  async updateQueueOrder(eventId: string, queueItems: Pick<QueueItem, 'id' | 'position'>[]): Promise<void> {
    return this.db.runTransaction(async transaction => {
      for (const item of queueItems) {
        const itemRef = this.db.collection('queue').doc(item.id);
        transaction.update(itemRef, {
          position: item.position,
          updatedAt: Timestamp.now()
        });
      }

      analyticsService.trackEvent('queue_reordered', {
        eventId,
        itemCount: queueItems.length
      });
    });
  }

  async processRequest(eventId: string, requestId: string, action: 'approve' | 'reject'): Promise<void> {
    return this.db.runTransaction(async transaction => {
      const requestRef = this.db.collection('requests').doc(requestId);
      const requestDoc = await transaction.get(requestRef);

      if (!requestDoc.exists) {
        throw new AppError({
          code: 'NOT_FOUND',
          message: 'Request not found',
          context: { requestId }
        });
      }

      const request = requestDoc.data() as SongRequest;
      
      if (action === 'approve') {
        // Add to queue
        const queueRef = this.db.collection('queue').doc();
        const queueSnapshot = await transaction.get(
          this.db.collection('queue')
            .where('eventId', '==', eventId)
            .orderBy('position', 'desc')
            .limit(1)
        );

        const lastPosition = queueSnapshot.empty ? 0 : queueSnapshot.docs[0].data().position;

        transaction.set(queueRef, {
          id: queueRef.id,
          eventId,
          songId: request.song.id,
          requestId,
          position: lastPosition + 1,
          addedAt: Timestamp.now(),
          status: 'pending'
        });
      }

      // Update request status
      transaction.update(requestRef, {
        status: action === 'approve' ? 'approved' : 'rejected',
        updatedAt: Timestamp.now()
      });

      analyticsService.trackEvent(`request_${action}d`, {
        eventId,
        requestId,
        songId: request.song.id
      });
    });
  }
} 