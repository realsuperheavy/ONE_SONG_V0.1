'use client';

import { db } from '@/lib/firebase/config';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc,
  arrayUnion,
  addDoc,
  where,
  limit,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { PerformanceMetricsCollector } from '@/lib/monitoring/PerformanceMetricsCollector';
import { FirebaseDebugger } from '@/debug/firebase/FirebaseDebugger';
import { analyticsService } from '@/lib/firebase/services/analytics';
import type { QueueItem, SongRequest } from '@/types/models';

export class QueueManager {
  private readonly eventId: string;
  private unsubscribe: (() => void) | null = null;
  private performanceMonitor: PerformanceMetricsCollector;
  private debugger: FirebaseDebugger;

  constructor(eventId: string) {
    this.eventId = eventId;
    this.performanceMonitor = new PerformanceMetricsCollector();
    this.debugger = new FirebaseDebugger(eventId);
  }

  async getQueuePosition(requestId: string): Promise<number> {
    this.performanceMonitor.startOperation('getQueuePosition');
    
    try {
      const queueRef = collection(db, `events/${this.eventId}/queue`);
      const queueQuery = query(
        queueRef,
        where('status', '==', 'pending'),
        orderBy('queuePosition')
      );

      const snapshot = await getDocs(queueQuery);
      const position = snapshot.docs.findIndex(doc => doc.id === requestId);
      
      this.performanceMonitor.endOperation('getQueuePosition');
      analyticsService.trackEvent('queue_position_checked', {
        eventId: this.eventId,
        requestId,
        position: position + 1,
        duration: this.performanceMonitor.getMetrics().responseTime
      });

      return position === -1 ? -1 : position + 1;
    } catch (error) {
      this.performanceMonitor.trackError('getQueuePosition');
      const diagnosis = await this.debugger.diagnoseRealTimeIssue();
      
      analyticsService.trackError(error as Error, {
        context: 'get_queue_position',
        eventId: this.eventId,
        requestId,
        diagnosis
      });
      
      throw error;
    }
  }

  async addToQueue(request: Omit<SongRequest, 'id'>): Promise<string> {
    this.performanceMonitor.startOperation('addToQueue');
    
    try {
      const queueRef = collection(db, `events/${this.eventId}/queue`);
      const sizeQuery = query(queueRef, orderBy('queuePosition', 'desc'), limit(1));
      const sizeSnapshot = await getDocs(sizeQuery);
      const lastPosition = sizeSnapshot.empty ? 0 : sizeSnapshot.docs[0].data().queuePosition;

      const docRef = await addDoc(queueRef, {
        ...request,
        queuePosition: lastPosition + 1,
        addedAt: Date.now()
      });

      this.performanceMonitor.endOperation('addToQueue');
      analyticsService.trackEvent('queue_item_added', {
        eventId: this.eventId,
        requestId: docRef.id,
        queuePosition: lastPosition + 1,
        duration: this.performanceMonitor.getMetrics().responseTime
      });

      return docRef.id;
    } catch (error) {
      this.performanceMonitor.trackError('addToQueue');
      const diagnosis = await this.debugger.diagnoseRealTimeIssue();
      
      analyticsService.trackError(error as Error, {
        context: 'add_to_queue',
        eventId: this.eventId,
        diagnosis
      });
      
      throw error;
    }
  }

  subscribeToQueue(callback: (queue: QueueItem[]) => void): () => void {
    this.performanceMonitor.startOperation('queueSubscription');
    
    const queueRef = collection(db, `events/${this.eventId}/queue`);
    const queueQuery = query(queueRef, orderBy('queuePosition', 'asc'));

    this.unsubscribe = onSnapshot(
      queueQuery,
      {
        next: (snapshot) => {
          const queue = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as QueueItem[];

          callback(queue);
          this.performanceMonitor.endOperation('queueSubscription');
          
          analyticsService.trackEvent('queue_updated', {
            eventId: this.eventId,
            queueSize: queue.length,
            duration: this.performanceMonitor.getMetrics().responseTime
          });
        },
        error: async (error) => {
          this.performanceMonitor.trackError('queueSubscription');
          const diagnosis = await this.debugger.diagnoseRealTimeIssue();
          
          analyticsService.trackError(error, {
            context: 'queue_subscription',
            eventId: this.eventId,
            diagnosis
          });
        }
      }
    );

    return () => {
      if (this.unsubscribe) {
        this.unsubscribe();
        this.unsubscribe = null;
      }
    };
  }

  dispose(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.performanceMonitor.dispose();
  }
} 