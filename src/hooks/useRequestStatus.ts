import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import { analyticsService } from '@/lib/firebase/services/analytics';
import type { SongRequest } from '@/types/models';

export function useRequestStatus(eventId: string, requestId: string) {
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
          
          analyticsService.trackRequestActivity(eventId, requestId, 'status_update', {
            status: requestData.status
          });
        }
        setLoading(false);
      },
      (error) => {
        setError(error.message);
        setLoading(false);
        
        analyticsService.trackError(error, {
          context: 'request_status_subscription',
          eventId,
          requestId
        });
      }
    );

    return () => unsubscribe();
  }, [eventId, requestId]);

  return { request, loading, error };
} 