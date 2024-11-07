import { useEffect, useState, useCallback } from 'react';
import { useQueueStore } from '@/store/queue';
import { queueService } from '@/lib/firebase/services/queue';
import { QueueItem } from '@/lib/firebase/services/queue';
import { useAuthStore } from '@/store/auth';

interface UseQueueOptions {
  autoSubscribe?: boolean;
}

export function useQueue(eventId: string, options: UseQueueOptions = {}) {
  const { autoSubscribe = true } = options;
  const user = useAuthStore((state) => state.user);
  const { 
    queue, 
    setQueue, 
    loading, 
    setLoading, 
    error, 
    setError 
  } = useQueueStore();

  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);

  useEffect(() => {
    if (!autoSubscribe || !eventId) return;

    setLoading(true);
    const unsubscribe = queueService.subscribeToQueue(eventId, (updatedQueue) => {
      setQueue(updatedQueue);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [eventId, autoSubscribe, setQueue, setLoading]);

  const addToQueue = useCallback(async (item: Omit<QueueItem, 'id' | 'queuePosition'>) => {
    try {
      await queueService.addToQueue({
        ...item,
        eventId,
        queuePosition: queue.length
      });
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [eventId, queue.length, setError]);

  const removeFromQueue = useCallback(async (itemId: string) => {
    if (!user?.type === 'dj') {
      throw new Error('Only DJs can remove items from queue');
    }

    try {
      await queueService.removeFromQueue(eventId, itemId);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [eventId, user?.type, setError]);

  const reorderQueue = useCallback(async (newOrder: string[]) => {
    if (!user?.type === 'dj') {
      throw new Error('Only DJs can reorder queue');
    }

    try {
      await queueService.reorderQueue(eventId, newOrder);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [eventId, user?.type, setError]);

  const playItem = useCallback((itemId: string) => {
    setCurrentlyPlaying(itemId);
  }, []);

  const pauseItem = useCallback(() => {
    setCurrentlyPlaying(null);
  }, []);

  return {
    queue,
    loading,
    error,
    currentlyPlaying,
    addToQueue,
    removeFromQueue,
    reorderQueue,
    playItem,
    pauseItem,
    isDJ: user?.type === 'dj'
  };
} 