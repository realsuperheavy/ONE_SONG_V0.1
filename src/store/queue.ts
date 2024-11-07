import { create } from 'zustand';
import { QueueItem } from '@/lib/firebase/services/queue';

interface QueueState {
  queue: QueueItem[];
  loading: boolean;
  error: string | null;
  setQueue: (queue: QueueItem[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useQueueStore = create<QueueState>((set) => ({
  queue: [],
  loading: false,
  error: null,
  setQueue: (queue) => set({ queue }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error })
})); 