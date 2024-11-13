import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import { analyticsService } from '@/lib/firebase/services/analytics';
import type { RequestActivity } from '@/types/analytics';
import type { SongRequest } from '@/types/models';

export function useRequestActivity(eventId: string, requestId: string) {
  const [activity, setActivity] = useState<RequestActivity>({
    eventId,
    requestId,
    action: '',
    metadata: {},
    timestamp: Date.now()
  });

  const [request, setRequest] = useState<SongRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const requestRef = doc(db, `events/${eventId}/requests/${requestId}`);

    const unsubscribe = onSnapshot(
      requestRef,
      (doc) => {
        if (doc.exists()) {
          const requestData = { id: doc.id, ...doc.data() } as SongRequest;
          setRequest(requestData);
          
          const newActivity: RequestActivity = {
            eventId,
            requestId,
            action: 'status_update',
            metadata: {
              status: requestData.status,
              votes: requestData.metadata.votes
            },
            timestamp: Date.now()
          };
          
          setActivity(newActivity);
          analyticsService.trackRequestActivity(eventId, requestId, 'status_update', newActivity.metadata);
        }
        setLoading(false);
      },
      (error) => {
        setError(error.message);
        setLoading(false);
        
        analyticsService.trackError(error, {
          context: 'request_activity_subscription',
          eventId,
          requestId
        });
      }
    );

    return () => unsubscribe();
  }, [eventId, requestId]);

  return { activity, request, loading, error };
} 