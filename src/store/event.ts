import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Event, QueueItem, EventStatus } from '@/types/events';
import { adminDb } from '@/lib/firebase/admin';
import { analyticsService } from '@/lib/firebase/services/analytics';

interface EventState {
  currentEvent: Event | null;
  queue: QueueItem[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setCurrentEvent: (event: Event | null) => void;
  updateEventStatus: (eventId: string, status: EventStatus) => Promise<void>;
  updateQueue: (queue: QueueItem[]) => void;
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  
  // Event Operations
  loadEvent: (eventId: string) => Promise<void>;
  subscribeToEvent: (eventId: string) => () => void;
  subscribeToQueue: (eventId: string) => () => void;
}

export const useEventStore = create<EventState>()(
  devtools(
    persist(
      (set, get) => ({
        currentEvent: null,
        queue: [],
        isLoading: false,
        error: null,

        setCurrentEvent: (event) => set({ currentEvent: event }),
        
        updateEventStatus: async (eventId, status) => {
          try {
            set({ isLoading: true });
            
            await adminDb
              .collection('events')
              .doc(eventId)
              .update({
                status,
                'metadata.updatedAt': new Date()
              });

            set((state) => ({
              currentEvent: state.currentEvent
                ? { ...state.currentEvent, status }
                : null
            }));

            analyticsService.trackEvent('event_status_updated', {
              eventId,
              oldStatus: get().currentEvent?.status,
              newStatus: status
            });
          } catch (error) {
            set({ error: 'Failed to update event status' });
            analyticsService.trackError(error as Error, {
              context: 'update_event_status',
              eventId
            });
            throw error;
          } finally {
            set({ isLoading: false });
          }
        },

        updateQueue: (queue) => set({ queue }),
        
        setError: (error) => set({ error }),
        
        setLoading: (isLoading) => set({ isLoading }),

        loadEvent: async (eventId) => {
          try {
            set({ isLoading: true, error: null });
            
            const eventDoc = await adminDb
              .collection('events')
              .doc(eventId)
              .get();

            if (!eventDoc.exists) {
              throw new Error('Event not found');
            }

            const eventData = eventDoc.data() as Event;
            set({ currentEvent: { ...eventData, id: eventDoc.id } });
          } catch (error) {
            set({ error: 'Failed to load event' });
            analyticsService.trackError(error as Error, {
              context: 'load_event',
              eventId
            });
            throw error;
          } finally {
            set({ isLoading: false });
          }
        },

        subscribeToEvent: (eventId) => {
          const unsubscribe = adminDb
            .collection('events')
            .doc(eventId)
            .onSnapshot(
              (doc) => {
                if (doc.exists) {
                  const eventData = doc.data() as Event;
                  set({ currentEvent: { ...eventData, id: doc.id } });
                }
              },
              (error) => {
                set({ error: 'Failed to subscribe to event updates' });
                analyticsService.trackError(error, {
                  context: 'event_subscription',
                  eventId
                });
              }
            );

          return unsubscribe;
        },

        subscribeToQueue: (eventId) => {
          const unsubscribe = adminDb
            .collection('events')
            .doc(eventId)
            .collection('queue')
            .orderBy('position')
            .onSnapshot(
              (snapshot) => {
                const queue = snapshot.docs.map((doc) => ({
                  ...doc.data(),
                  id: doc.id
                })) as QueueItem[];
                set({ queue });
              },
              (error) => {
                set({ error: 'Failed to subscribe to queue updates' });
                analyticsService.trackError(error, {
                  context: 'queue_subscription',
                  eventId
                });
              }
            );

          return unsubscribe;
        }
      }),
      {
        name: 'event-storage',
        partialize: (state) => ({
          currentEvent: state.currentEvent,
          queue: state.queue
        })
      }
    )
  )
); 