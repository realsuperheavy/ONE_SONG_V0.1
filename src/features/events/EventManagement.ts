import { db, rtdb } from '@/lib/firebase/config';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  DocumentReference,
  WriteBatch,
  writeBatch,
  increment
} from 'firebase/firestore';
import { ref, set, update, remove, get, query, orderByChild } from '@firebase/database';
import { analyticsService } from '@/lib/firebase/services/analytics';
import { ProductionMonitor } from '@/lib/deployment/ProductionMonitor';
import { Cache } from '@/lib/cache';
import { Event, EventStatus } from '@/types/models';

interface EventInitializationResult {
  event: Event;
  success: boolean;
  error?: Error;
}

export class EventManager {
  private readonly eventsCollection = collection(db, 'events');
  private readonly subCollections = ['requests', 'queue', 'attendees', 'analytics'] as const;
  private readonly cache: Cache<Event>;
  private readonly monitor: ProductionMonitor;

  constructor() {
    this.cache = new Cache({ maxSize: 100, ttl: 5 * 60 * 1000 }); // 5 minutes cache
    this.monitor = new ProductionMonitor();
  }

  /**
   * Initializes a new event with all required sub-collections and monitoring
   */
  async initializeEvent(eventData: Partial<Event>): Promise<EventInitializationResult> {
    const startTime = Date.now();
    const batch = writeBatch(db);
    const eventRef = doc(this.eventsCollection);

    try {
      // Create base event object
      const event = this.createEventObject(eventRef.id, eventData);
      
      // Initialize in Firestore and RTDB
      await Promise.all([
        this.executeEventInitialization(event, batch),
        this.initializeRealTimeData(event)
      ]);

      // Track metrics
      analyticsService.trackEvent('event_created', {
        eventId: event.id,
        djId: event.djId,
        type: event.details.type
      });

      // Monitor performance
      this.monitor.monitorProduction();

      return {
        event,
        success: true
      };

    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'initialize_event',
        eventData
      });
      
      return {
        event: null as any,
        success: false,
        error: error as Error
      };
    } finally {
      // Track initialization time
      const duration = Date.now() - startTime;
      analyticsService.trackMetric('event_initialization_time', duration);
    }
  }

  /**
   * Updates event details with real-time sync
   */
  async updateEvent(eventId: string, updates: Partial<Event>): Promise<void> {
    try {
      const startTime = Date.now();

      // Update both Firestore and RTDB
      await Promise.all([
        updateDoc(doc(this.eventsCollection, eventId), {
          ...updates,
          updatedAt: serverTimestamp()
        }),
        update(ref(rtdb, `events/${eventId}`), {
          ...updates,
          updatedAt: serverTimestamp()
        })
      ]);

      // Invalidate cache
      this.cache.delete(eventId);

      // Track performance
      const duration = Date.now() - startTime;
      analyticsService.trackMetric('event_update_time', duration);

    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'update_event',
        eventId,
        updates
      });
      throw error;
    }
  }

  /**
   * Safely deletes an event and its sub-collections
   */
  async deleteEvent(eventId: string): Promise<void> {
    const batch = writeBatch(db);

    try {
      // Delete from Firestore
      const eventRef = doc(this.eventsCollection, eventId);
      batch.delete(eventRef);

      // Delete sub-collections
      for (const collectionName of this.subCollections) {
        const collectionRef = collection(db, `events/${eventId}/${collectionName}`);
        batch.delete(doc(collectionRef));
      }

      // Delete from RTDB
      await Promise.all([
        batch.commit(),
        remove(ref(rtdb, `events/${eventId}`))
      ]);

      // Clear cache
      this.cache.delete(eventId);

      analyticsService.trackEvent('event_deleted', { eventId });

    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'delete_event',
        eventId
      });
      throw error;
    }
  }

  private createEventObject(eventId: string, data: Partial<Event>): Event {
    return {
      id: eventId,
      djId: data.djId!,
      status: 'active',
      details: {
        name: data.details?.name || '',
        description: data.details?.description,
        venue: data.details?.venue,
        date: data.details?.date || new Date().toISOString(),
        type: data.details?.type || 'party'
      },
      settings: {
        allowTips: data.settings?.allowTips ?? true,
        requireApproval: data.settings?.requireApproval ?? true,
        maxQueueSize: data.settings?.maxQueueSize ?? 50,
        blacklistedGenres: data.settings?.blacklistedGenres ?? []
      },
      stats: {
        attendeeCount: 0,
        requestCount: 0,
        totalTips: 0
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
  }

  private async initializeRealTimeData(event: Event): Promise<void> {
    const eventRef = ref(rtdb, `events/${event.id}`);
    await set(eventRef, {
      ...event,
      realtime: {
        activeUsers: 0,
        currentSong: null,
        queueLength: 0
      }
    });
  }
} 