import { create } from 'zustand';
import type { QueueItem } from '@/types/models';
import { queueService } from '@/lib/firebase/services/queue';
import { PerformanceMonitor } from '@/lib/monitoring/PerformanceMonitor';
import { analyticsService } from '@/lib/firebase/services/analytics';

const performanceMonitor = PerformanceMonitor.getInstance();

interface QueueState {
  queue: QueueItem[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  lastItemId: string | null;
  pageSize: number;
  loadMoreQueue: (eventId: string) => Promise<void>;
  setQueue: (queue: QueueItem[]) => void;
  setError: (error: string | null) => void;
}

export const useQueueStore = create<QueueState>((set, get) => ({
  queue: [],
  loading: false,
  error: null,
  hasMore: true,
  lastItemId: null,
  pageSize: 20,

  loadMoreQueue: async (eventId: string) => {
    performanceMonitor.startOperation('loadMoreQueue');
    const { queue, lastItemId, pageSize } = get();
    set({ loading: true, error: null });

    try {
      const newItems = await queueService.getQueuePaginated(eventId, pageSize, lastItemId);
      set({
        queue: [...queue, ...newItems],
        lastItemId: newItems.length > 0 ? newItems[newItems.length - 1].id : null,
        hasMore: newItems.length === pageSize
      });

      performanceMonitor.endOperation('loadMoreQueue');
      analyticsService.trackEvent('queue_loaded_more', {
        eventId,
        itemCount: newItems.length,
        duration: performanceMonitor.getMetrics().responseTime
      });
    } catch (error) {
      performanceMonitor.trackError('loadMoreQueue');
      set({ error: 'Failed to load more queue items' });
      analyticsService.trackError(error as Error, {
        context: 'load_more_queue',
        eventId
      });
    } finally {
      set({ loading: false });
    }
  },

  setQueue: (queue: QueueItem[]) => {
    performanceMonitor.startOperation('setQueue');
    set({ queue });
    performanceMonitor.endOperation('setQueue');
  },

  setError: (error: string | null) => set({ error })
})); 