import { db } from '@/lib/firebase/config';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit,
  writeBatch,
  serverTimestamp,
  increment,
  runTransaction
} from 'firebase/firestore';
import { analyticsService } from '@/lib/firebase/services/analytics';
import { SongRequest, QueueItem } from '@/types/models';

interface QueueOperationResult {
  success: boolean;
  error?: Error;
}

export class QueueManager {
  /**
   * Add a song request to the queue with position tracking
   */
  async addToQueue(request: SongRequest): Promise<QueueOperationResult> {
    try {
      const eventRef = doc(db, 'events', request.eventId);
      
      return await runTransaction(db, async (transaction) => {
        // Get current event for settings and validation
        const eventDoc = await transaction.get(eventRef);
        if (!eventDoc.exists()) {
          throw new Error('Event not found');
        }

        const event = eventDoc.data();
        
        // Check queue size limit
        const queueRef = collection(db, `events/${request.eventId}/queue`);
        const queueQuery = query(queueRef, where('status', '==', 'pending'));
        const queueSnapshot = await getDocs(queueQuery);
        
        if (queueSnapshot.size >= event.settings.maxQueueSize) {
          throw new Error('Queue is full');
        }

        // Get next position
        const positionQuery = query(
          queueRef, 
          orderBy('position', 'desc'), 
          limit(1)
        );
        const positionSnapshot = await getDocs(positionQuery);
        const nextPosition = positionSnapshot.empty ? 
          0 : 
          positionSnapshot.docs[0].data().position + 1;

        // Create queue item
        const queueItemRef = doc(queueRef);
        const queueItem: QueueItem = {
          id: queueItemRef.id,
          eventId: request.eventId,
          requestId: request.id,
          song: request.song,
          userId: request.userId,
          position: nextPosition,
          status: 'pending',
          addedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        transaction.set(queueItemRef, queueItem);

        // Update event stats
        transaction.update(eventRef, {
          'stats.queueLength': increment(1),
          updatedAt: serverTimestamp()
        });

        analyticsService.trackEvent('queue_item_added', {
          eventId: request.eventId,
          queueItemId: queueItem.id,
          position: nextPosition
        });

        return { success: true };
      });

    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'add_to_queue',
        requestId: request.id
      });
      return { 
        success: false, 
        error: error as Error 
      };
    }
  }

  /**
   * Remove an item from the queue and reorder remaining items
   */
  async removeFromQueue(eventId: string, queueItemId: string): Promise<QueueOperationResult> {
    try {
      return await runTransaction(db, async (transaction) => {
        const queueRef = doc(db, `events/${eventId}/queue/${queueItemId}`);
        const queueDoc = await transaction.get(queueRef);
        
        if (!queueDoc.exists()) {
          throw new Error('Queue item not found');
        }

        const removedPosition = queueDoc.data().position;

        // Remove the item
        transaction.delete(queueRef);

        // Update positions for remaining items
        const remainingQuery = query(
          collection(db, `events/${eventId}/queue`),
          where('position', '>', removedPosition)
        );
        const remainingDocs = await getDocs(remainingQuery);

        remainingDocs.forEach(doc => {
          transaction.update(doc.ref, {
            position: increment(-1),
            updatedAt: serverTimestamp()
          });
        });

        // Update event stats
        transaction.update(doc(db, 'events', eventId), {
          'stats.queueLength': increment(-1),
          updatedAt: serverTimestamp()
        });

        analyticsService.trackEvent('queue_item_removed', {
          eventId,
          queueItemId
        });

        return { success: true };
      });

    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'remove_from_queue',
        eventId,
        queueItemId
      });
      return { 
        success: false, 
        error: error as Error 
      };
    }
  }

  /**
   * Reorder queue items with position updates
   */
  async reorderQueue(
    eventId: string, 
    newOrder: string[]
  ): Promise<QueueOperationResult> {
    try {
      const batch = writeBatch(db);

      newOrder.forEach((itemId, index) => {
        const queueRef = doc(db, `events/${eventId}/queue/${itemId}`);
        batch.update(queueRef, {
          position: index,
          updatedAt: serverTimestamp()
        });
      });

      await batch.commit();

      analyticsService.trackEvent('queue_reordered', {
        eventId,
        itemCount: newOrder.length
      });

      return { success: true };

    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'reorder_queue',
        eventId
      });
      return { 
        success: false, 
        error: error as Error 
      };
    }
  }

  /**
   * Get the next item in queue
   */
  async getNextInQueue(eventId: string): Promise<QueueItem | null> {
    try {
      const queueRef = collection(db, `events/${eventId}/queue`);
      const nextQuery = query(
        queueRef,
        where('status', '==', 'pending'),
        orderBy('position'),
        limit(1)
      );

      const snapshot = await getDocs(nextQuery);
      return snapshot.empty ? null : snapshot.docs[0].data() as QueueItem;

    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'get_next_in_queue',
        eventId
      });
      throw error;
    }
  }

  /**
   * Get current queue with pagination
   */
  async getQueue(
    eventId: string, 
    pageSize: number = 20, 
    startAfter?: number
  ): Promise<QueueItem[]> {
    try {
      const queueRef = collection(db, `events/${eventId}/queue`);
      let queueQuery = query(
        queueRef,
        orderBy('position'),
        limit(pageSize)
      );

      if (startAfter !== undefined) {
        queueQuery = query(
          queueQuery,
          where('position', '>', startAfter)
        );
      }

      const snapshot = await getDocs(queueQuery);
      return snapshot.docs.map(doc => doc.data() as QueueItem);

    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'get_queue',
        eventId
      });
      throw error;
    }
  }
} 