import { db } from '../config';
import { collection, doc, addDoc, deleteDoc, onSnapshot, query, orderBy, limit, startAfter, getDocs } from 'firebase/firestore';
import type { QueueItem } from '@/types/models';

export const queueService = {
  subscribeToQueue: (eventId: string, callback: (queue: QueueItem[]) => void) => {
    const queueRef = collection(db, `events/${eventId}/queue`);
    const queueQuery = query(queueRef, orderBy('queuePosition'));

    return onSnapshot(queueQuery, (snapshot) => {
      const queueItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as QueueItem[];
      callback(queueItems);
    });
  },

  addToQueue: async (eventId: string, item: Omit<QueueItem, 'id' | 'queuePosition'>): Promise<string> => {
    const queueRef = collection(db, `events/${eventId}/queue`);
    const newItem = {
      ...item,
      queuePosition: 0,
      addedAt: new Date().toISOString()
    };

    const docRef = await addDoc(queueRef, newItem);
    return docRef.id;
  },

  removeFromQueue: async (eventId: string, itemId: string): Promise<void> => {
    const itemRef = doc(db, `events/${eventId}/queue/${itemId}`);
    await deleteDoc(itemRef);
  },

  reorderQueue: async (eventId: string, newOrder: string[]): Promise<void> => {
    const batch = db.batch();

    newOrder.forEach((itemId, index) => {
      const itemRef = doc(db, `events/${eventId}/queue/${itemId}`);
      batch.update(itemRef, { queuePosition: index });
    });

    await batch.commit();
  },

  getQueuePaginated: async (eventId: string, pageSize: number, lastItemId?: string): Promise<QueueItem[]> => {
    const queueRef = collection(db, `events/${eventId}/queue`);
    let queueQuery = query(queueRef, orderBy('queuePosition'), limit(pageSize));

    if (lastItemId) {
      const lastItemDoc = await getDocs(doc(db, `events/${eventId}/queue/${lastItemId}`));
      queueQuery = query(queueQuery, startAfter(lastItemDoc));
    }

    const snapshot = await getDocs(queueQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QueueItem));
  }
}; 