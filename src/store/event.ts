import { create } from 'zustand';
import type { Event } from '@/types/models';
import { eventService } from '@/lib/firebase/services/event';
import { analyticsService } from '@/lib/firebase/services/analytics';
import { PerformanceMonitor } from '@/lib/monitoring/PerformanceMonitor';

const performanceMonitor = PerformanceMonitor.getInstance();

interface EventState {
  currentEvent: Event | null;
  loading: boolean;
  error: string | null;
  setCurrentEvent: (event: Event | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  loadEvent: (eventId: string) => Promise<void>;
  updateEvent: (eventId: string, updates: Partial<Event>) => Promise<void>;
}

export const useEventStore = create<EventState>((set) => ({
  currentEvent: null,
  loading: false,
  error: null,

  setCurrentEvent: (event) => {
    performanceMonitor.startOperation('setCurrentEvent');
    set({ currentEvent: event });
    performanceMonitor.endOperation('setCurrentEvent');
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  loadEvent: async (eventId: string) => {
    performanceMonitor.startOperation('loadEvent');
    set({ loading: true, error: null });

    try {
      const event = await eventService.getEvent(eventId);
      set({ currentEvent: event });
      
      performanceMonitor.endOperation('loadEvent');
      analyticsService.trackEvent('event_loaded', {
        eventId,
        duration: performanceMonitor.getMetrics().responseTime
      });
    } catch (error) {
      performanceMonitor.trackError('loadEvent');
      set({ error: 'Failed to load event' });
      analyticsService.trackError(error as Error, {
        context: 'load_event',
        eventId
      });
    } finally {
      set({ loading: false });
    }
  },

  updateEvent: async (eventId: string, updates: Partial<Event>) => {
    performanceMonitor.startOperation('updateEvent');
    set({ loading: true, error: null });

    try {
      await eventService.updateEvent(eventId, updates);
      const updatedEvent = await eventService.getEvent(eventId);
      set({ currentEvent: updatedEvent });
      
      performanceMonitor.endOperation('updateEvent');
      analyticsService.trackEvent('event_updated', {
        eventId,
        updates: Object.keys(updates),
        duration: performanceMonitor.getMetrics().responseTime
      });
    } catch (error) {
      performanceMonitor.trackError('updateEvent');
      set({ error: 'Failed to update event' });
      analyticsService.trackError(error as Error, {
        context: 'update_event',
        eventId
      });
    } finally {
      set({ loading: false });
    }
  }
})); 