import { adminDb } from '../admin';
import type { Event, User } from '@/types/models';
import { analyticsService } from './analytics';

interface AttendeeSession {
  userId: string;
  eventId: string;
  joinedAt: Date;
  lastActive: Date;
  status: 'active' | 'inactive' | 'left';
}

export class AttendeeManagementService {
  constructor(private readonly db = adminDb) {}

  async joinEvent(eventId: string, userId: string): Promise<void> {
    return this.db.runTransaction(async (transaction) => {
      const eventRef = this.db.collection('events').doc(eventId);
      const attendeeRef = this.db
        .collection('events')
        .doc(eventId)
        .collection('attendees')
        .doc(userId);

      const [eventDoc, attendeeDoc] = await Promise.all([
        transaction.get(eventRef),
        transaction.get(attendeeRef)
      ]);

      if (!eventDoc.exists) throw new Error('Event not found');
      const event = eventDoc.data() as Event;

      // Create or update attendee session
      transaction.set(attendeeRef, {
        userId,
        eventId,
        joinedAt: new Date(),
        lastActive: new Date(),
        status: 'active'
      } as AttendeeSession, { merge: true });

      // Update event stats
      if (!attendeeDoc.exists) {
        transaction.update(eventRef, {
          'stats.attendeeCount': event.stats.attendeeCount + 1,
          updatedAt: new Date()
        });
      }

      analyticsService.trackEvent('attendee_joined_event', {
        eventId,
        userId
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
      lastActive: new Date()
    });

    analyticsService.trackEvent('attendee_status_updated', {
      eventId,
      userId,
      status
    });
  }

  async getEventAttendees(
    eventId: string,
    options: {
      status?: AttendeeSession['status'];
      limit?: number;
    } = {}
  ): Promise<AttendeeSession[]> {
    let query = this.db
      .collection('events')
      .doc(eventId)
      .collection('attendees');

    if (options.status) {
      query = query.where('status', '==', options.status);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => doc.data() as AttendeeSession);
  }

  async cleanupInactiveAttendees(eventId: string, inactiveThreshold: number): Promise<void> {
    const cutoffTime = new Date(Date.now() - inactiveThreshold);
    
    const inactiveAttendees = await this.db
      .collection('events')
      .doc(eventId)
      .collection('attendees')
      .where('status', '==', 'active')
      .where('lastActive', '<', cutoffTime)
      .get();

    const batch = this.db.batch();
    inactiveAttendees.docs.forEach(doc => {
      batch.update(doc.ref, {
        status: 'inactive',
        updatedAt: new Date()
      });
    });

    await batch.commit();
  }
} 