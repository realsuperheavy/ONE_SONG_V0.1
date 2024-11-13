import { useEffect, useCallback } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { analyticsService } from '@/lib/firebase/services/analytics';
import type { SongRequest } from '@/types/models';
import type { RequestActivity } from '@/types/analytics';

export function useRequestActivityTracking(eventId: string, requestId: string) {
  const trackActivity = useCallback(async (action: string, metadata?: Record<string, any>) => {
    try {
      const activity: RequestActivity = {
        eventId,
        requestId,
        action,
        metadata,
        timestamp: Date.now()
      };

      analyticsService.trackRequestActivity(eventId, requestId, action, metadata);
    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'track_request_activity',
        eventId,
        requestId
      });
    }
  }, [eventId, requestId]);

  useEffect(() => {
    const requestRef = doc(db, `events/${eventId}/requests/${requestId}`);

    const unsubscribe = onSnapshot(requestRef, (doc) => {
      if (doc.exists()) {
        const request = doc.data() as SongRequest;
        trackActivity('request_updated', {
          status: request.status,
          votes: request.metadata.votes
        });
      }
    });

    return () => unsubscribe();
  }, [eventId, requestId, trackActivity]);

  return { trackActivity };
} 