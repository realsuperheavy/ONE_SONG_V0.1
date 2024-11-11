import { adminDb } from '../admin';
import type { Event, SongRequest } from '@/types/models';
import { analyticsService } from './analytics';

export class EventRequestService {
  constructor(private readonly db = adminDb) {}

  async linkRequestToEvent(
    eventId: string,
    requestId: string,
    userId: string
  ): Promise<void> {
    return this.db.runTransaction(async (transaction) => {
      // Get event and request docs
      const eventRef = this.db.collection('events').doc(eventId);
      const requestRef = this.db.collection('requests').doc(requestId);
      
      const [eventDoc, requestDoc] = await Promise.all([
        transaction.get(eventRef),
        transaction.get(requestRef)
      ]);

      if (!eventDoc.exists) throw new Error('Event not found');
      if (!requestDoc.exists) throw new Error('Request not found');

      const event = eventDoc.data() as Event;
      const request = requestDoc.data() as SongRequest;

      // Update request with event reference
      transaction.update(requestRef, {
        eventId,
        status: event.settings.requireApproval ? 'pending' : 'approved',
        updatedAt: new Date()
      });

      // Update event stats
      transaction.update(eventRef, {
        'stats.requestCount': event.stats.requestCount + 1,
        updatedAt: new Date()
      });

      // Track the connection
      analyticsService.trackEvent('request_linked_to_event', {
        eventId,
        requestId,
        userId
      });
    });
  }

  async getEventRequests(
    eventId: string,
    options: {
      status?: SongRequest['status'];
      limit?: number;
      orderBy?: 'votes' | 'requestTime';
    } = {}
  ): Promise<SongRequest[]> {
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
  }
} 