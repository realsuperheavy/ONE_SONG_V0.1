import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  onSnapshot,
  orderBy,
  writeBatch
} from '@firebase/firestore';
import { db } from '../config';
import { SongRequest } from '@/types/models';

export interface QueueItem extends SongRequest {
  queuePosition: number;
  addedAt: string;
}

export const queueService = {
  addToQueue: async (request: SongRequest): Promise<string> => {
    try {
      const queueRef = collection(db, 'queues');
      const queueItem: QueueItem = {
        ...request,
        queuePosition: 0, // Will be updated in batch
        addedAt: new Date().toISOString()
      };

      const docRef = await addDoc(queueRef, queueItem);
      return docRef.id;
    } catch (error) {
      throw new Error(`Failed to add to queue: ${error}`);
    }
  },

  removeFromQueue: async (eventId: string, queueItemId: string): Promise<void> => {
    try {
      const queueRef = doc(db, 'queues', queueItemId);
      await deleteDoc(queueRef);
    } catch (error) {
      throw new Error(`Failed to remove from queue: ${error}`);
    }
  },

  reorderQueue: async (eventId: string, newOrder: string[]): Promise<void> => {
    try {
      const batch = writeBatch(db);

      newOrder.forEach((itemId, index) => {
        const queueRef = doc(db, 'queues', itemId);
        batch.update(queueRef, { queuePosition: index });
      });

      await batch.commit();
    } catch (error) {
      throw new Error(`Failed to reorder queue: ${error}`);
    }
  },

  subscribeToQueue: (
    eventId: string, 
    callback: (queue: QueueItem[]) => void
  ) => {
    const queueQuery = query(
      collection(db, 'queues'),
      where('eventId', '==', eventId),
      orderBy('queuePosition', 'asc')
    );

    return onSnapshot(queueQuery, (snapshot) => {
      const queue = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as QueueItem[];
      callback(queue);
    });
  }
}; 