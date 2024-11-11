import { adminDb, Timestamp } from '../admin';
import type { Event, EventStatus } from '@/types/models';

export class EventAdminService {
  constructor(private readonly db = adminDb) {}

  async batchUpdateEventStatus(
    eventIds: string[],
    status: EventStatus
  ): Promise<void> {
    const batch = this.db.batch();
    
    eventIds.forEach(eventId => {
      const ref = this.db.collection('events').doc(eventId);
      batch.update(ref, { 
        status,
        updatedAt: Timestamp.now()
      });
    });

    await batch.commit();
  }

  async forceCloseEvent(eventId: string): Promise<void> {
    const eventRef = this.db.collection('events').doc(eventId);
    
    await this.db.runTransaction(async transaction => {
      const event = await transaction.get(eventRef);
      if (!event.exists) throw new Error('Event not found');

      // Update event status
      transaction.update(eventRef, {
        status: 'closed',
        closedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      // Clear active requests
      const requests = await this.db
        .collection(`events/${eventId}/requests`)
        .where('status', '==', 'pending')
        .get();

      requests.forEach(doc => {
        transaction.update(doc.ref, {
          status: 'cancelled',
          updatedAt: Timestamp.now()
        });
      });
    });
  }

  async getEventAnalytics(eventId: string): Promise<EventAnalytics> {
    const event = await this.db.collection('events').doc(eventId).get();
    if (!event.exists) throw new Error('Event not found');

    const [requests, queueItems] = await Promise.all([
      this.db.collection(`events/${eventId}/requests`).get(),
      this.db.collection(`events/${eventId}/queue`).get()
    ]);

    return {
      totalRequests: requests.size,
      queueSize: queueItems.size,
      // Add more analytics as needed
    };
  }
} 