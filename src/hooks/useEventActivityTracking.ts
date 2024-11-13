import { useEffect, useCallback } from 'react';
import { EventActivityService } from '@/lib/services/event-activity';
import { analyticsService } from '@/lib/firebase/services/analytics';
import type { EventActivity } from '@/types/analytics';

export function useEventActivityTracking(eventId: string) {
  const trackActivity = useCallback(async (action: string, metadata?: Record<string, any>) => {
    try {
      const activityService = new EventActivityService(eventId);
      await activityService.trackActivity(action, metadata);
    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'track_event_activity',
        eventId
      });
    }
  }, [eventId]);

  useEffect(() => {
    const activityService = new EventActivityService(eventId);
    
    const unsubscribe = activityService.subscribeToActivity((activity: EventActivity) => {
      analyticsService.trackEventActivity(eventId, 'activity_update', {
        action: activity.action,
        metadata: activity.metadata
      });
    });

    return () => unsubscribe();
  }, [eventId]);

  return { trackActivity };
} 