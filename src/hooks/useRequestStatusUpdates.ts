import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { analyticsService } from '@/lib/firebase/services/analytics';
import type { SongRequest } from '@/types/models';
import { useToast } from '@/hooks/useToast';

export function useRequestStatusUpdates(eventId: string, requestId: string) {
  const [request, setRequest] = useState<SongRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const requestRef = doc(db, `events/${eventId}/requests/${requestId}`);

    const unsubscribe = onSnapshot(
      requestRef,
      (doc) => {
        if (doc.exists()) {
          const requestData = { id: doc.id, ...doc.data() } as SongRequest;
          const previousStatus = request?.status;
          setRequest(requestData);

          if (previousStatus && previousStatus !== requestData.status) {
            showToast({
              title: "Request Status Updated",
              description: `Your request is now ${requestData.status}`,
              variant: requestData.status === 'approved' ? 'default' : 'destructive'
            });

            analyticsService.trackRequestActivity(eventId, requestId, 'status_changed', {
              previousStatus,
              newStatus: requestData.status
            });
          }
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error subscribing to request updates:', error);
        analyticsService.trackError(error, {
          context: 'request_status_updates',
          eventId,
          requestId
        });
      }
    );

    return () => unsubscribe();
  }, [eventId, requestId, request?.status, showToast]);

  return { request, loading };
} 