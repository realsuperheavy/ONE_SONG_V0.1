import { db } from '@/lib/firebase/config';
import { collection, addDoc, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { analyticsService } from '@/lib/firebase/services/analytics';
import type { EventActivity } from '@/types/analytics';

export class EventActivityService {
  private readonly eventId: string;

  constructor(eventId: string) {
    this.eventId = eventId;
  }

  async trackActivity(action: string, metadata?: Record<string, any>): Promise<void> {
    try {
      const activityRef = collection(db, `events/${this.eventId}/activity`);
      const activity: EventActivity = {
        eventId: this.eventId,
        action,
        metadata,
        timestamp: Date.now()
      };

      await addDoc(activityRef, activity);
      analyticsService.trackEventActivity(this.eventId, action, metadata);
    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'track_event_activity',
        eventId: this.eventId
      });
    }
  }

  subscribeToActivity(callback: (activity: EventActivity) => void): () => void {
    const activityRef = collection(db, `events/${this.eventId}/activity`);
    const activityQuery = query(
      activityRef,
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    return onSnapshot(activityQuery, (snapshot) => {
      if (!snapshot.empty) {
        const latestActivity = snapshot.docs[0].data() as EventActivity;
        callback(latestActivity);
      }
    });
  }
} 