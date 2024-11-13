import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { analyticsService } from '@/lib/firebase/services/analytics';
import type { SongRequest } from '@/types/models';

export function useRequest(eventId: string, requestId: string) {
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
          analyticsService.trackRequestActivity(eventId, requestId, 'request_updated', {
            status: requestData.status
          });
        }
        setLoading(false);
      },
      (error) => {
        setError(error.message);
        setLoading(false);
        analyticsService.trackError(error, {
          context: 'request_subscription',
          eventId,
          requestId
        });
      }
    );

    return () => unsubscribe();
  }, [eventId, requestId]);

  return { request, loading, error };
} 