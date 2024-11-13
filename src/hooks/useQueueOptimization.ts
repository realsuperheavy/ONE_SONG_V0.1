import { useCallback, useRef } from 'react';
import { useQueueStore } from '@/store/queue';
import debounce from 'lodash/debounce';

export function useQueueOptimization() {
  const { queue, setQueue } = useQueueStore();
  const queueRef = useRef(queue);

  const debouncedUpdate = useCallback(
    debounce((newQueue) => {
      setQueue(newQueue);
    }, 300),
    []
  );

  const optimizedSetQueue = useCallback((newQueue: typeof queue) => {
    queueRef.current = newQueue;
    debouncedUpdate(newQueue);
  }, [debouncedUpdate]);

  return {
    optimizedSetQueue
  };
} 