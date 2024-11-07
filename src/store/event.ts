import { create } from 'zustand';
import { Event } from '@/types/models';

interface EventState {
  currentEvent: Event | null;
  djEvents: Event[];
  loading: boolean;
  error: string | null;
  setCurrentEvent: (event: Event | null) => void;
  setDJEvents: (events: Event[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useEventStore = create<EventState>((set) => ({
  currentEvent: null,
  djEvents: [],
  loading: false,
  error: null,
  setCurrentEvent: (event) => set({ currentEvent: event }),
  setDJEvents: (events) => set({ djEvents: events }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error })
})); 