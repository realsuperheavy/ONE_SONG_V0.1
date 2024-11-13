import { db } from '../config';
import { 
  collection, 
  doc, 
  getDoc, 
  query, 
  where, 
  getDocs, 
  updateDoc 
} from 'firebase/firestore';
import { PerformanceMonitor } from '@/lib/monitoring/PerformanceMonitor';
import { analyticsService } from '@/lib/firebase/services/analytics';
import type { Event } from '@/types/models';

const performanceMonitor = PerformanceMonitor.getInstance();

export const eventService = {
  getEventByCode: async (code: string): Promise<Event> => {
    performanceMonitor.startOperation('getEventByCode');
    try {
      const eventsRef = collection(db, 'events');
      const q = query(eventsRef, where('code', '==', code));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        performanceMonitor.trackError('getEventByCode');
        analyticsService.trackEvent('event_lookup_failed', {
          code,
          reason: 'not_found',
          duration: performanceMonitor.getMetrics().responseTime
        });
        throw new Error('Event not found');
      }

      const eventDoc = querySnapshot.docs[0];
      const event = { id: eventDoc.id, ...eventDoc.data() } as Event;

      performanceMonitor.endOperation('getEventByCode');
      analyticsService.trackEvent('event_lookup_success', {
        eventId: event.id,
        code,
        duration: performanceMonitor.getMetrics().responseTime
      });

      return event;
    } catch (error) {
      performanceMonitor.trackError('getEventByCode');
      analyticsService.trackError(error as Error, {
        context: 'get_event_by_code',
        code
      });
      throw error;
    }
  },

  getEvent: async (eventId: string): Promise<Event> => {
    performanceMonitor.startOperation('getEvent');
    try {
      const eventRef = doc(db, 'events', eventId);
      const eventDoc = await getDoc(eventRef);

      if (!eventDoc.exists()) {
        performanceMonitor.trackError('getEvent');
        analyticsService.trackEvent('event_lookup_failed', {
          eventId,
          reason: 'not_found',
          duration: performanceMonitor.getMetrics().responseTime
        });
        throw new Error('Event not found');
      }

      const event = { id: eventDoc.id, ...eventDoc.data() } as Event;
      
      performanceMonitor.endOperation('getEvent');
      analyticsService.trackEvent('event_lookup_success', {
        eventId,
        duration: performanceMonitor.getMetrics().responseTime
      });

      return event;
    } catch (error) {
      performanceMonitor.trackError('getEvent');
      analyticsService.trackError(error as Error, {
        context: 'get_event',
        eventId
      });
      throw error;
    }
  },

  updateEvent: async (eventId: string, updates: Partial<Event>): Promise<void> => {
    performanceMonitor.startOperation('updateEvent');
    try {
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, updates);
      
      performanceMonitor.endOperation('updateEvent');
      analyticsService.trackEvent('event_updated', {
        eventId,
        updatedFields: Object.keys(updates),
        duration: performanceMonitor.getMetrics().responseTime
      });
    } catch (error) {
      performanceMonitor.trackError('updateEvent');
      analyticsService.trackError(error as Error, {
        context: 'update_event',
        eventId
      });
      throw error;
    }
  }
}; 