import { useEffect } from 'react';
import { useQueueStore } from '@/store/queue';
import { queueService } from '@/lib/firebase/services/queue';
import { FirebaseDebugger } from '@/lib/firebase/services/firebase-debugger';

export function useQueueSync(eventId: string) {
  const { setQueue, setError } = useQueueStore();
  
  useEffect(() => {
    const debugger = new FirebaseDebugger(eventId);
    let unsubscribe: (() => void) | null = null;

    const initializeSync = async () => {
      try {
        const diagnosis = await debugger.diagnoseRealTimeIssue();
        
        if (diagnosis.healthStatus !== 'healthy') {
          await debugger.forceReconnect();
        }

        unsubscribe = queueService.subscribeToQueue(eventId, (updatedQueue) => {
          setQueue(updatedQueue);
        });
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to sync queue');
      }
    };

    initializeSync();
    return () => unsubscribe?.();
  }, [eventId, setQueue, setError]);
} 