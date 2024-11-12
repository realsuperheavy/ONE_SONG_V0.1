import { getFirestore, type Firestore, CollectionReference } from 'firebase/firestore';
import { app } from '@/lib/firebase/config';
import { 
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  writeBatch,
  runTransaction,
  serverTimestamp,
  limit,
  onSnapshot,
  DocumentSnapshot,
  QuerySnapshot,
  DocumentData,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';
import { analyticsService } from '@/lib/firebase/services/analytics';
import { QueueItem } from '@/types/events';

class AppError extends Error {
  code: string;
  context: Record<string, any>;

  constructor({ code, message, context }: { 
    code: string; 
    message: string; 
    context: Record<string, any> 
  }) {
    super(message);
    this.code = code;
    this.context = context;
  }
}

export class QueueManager {
  private eventId: string;
  private db: Firestore;
  private queueRef: CollectionReference;

  constructor(eventId: string) {
    this.eventId = eventId;
    this.db = getFirestore(app);
    this.queueRef = collection(this.db, 'queue');
  }

  async getQueue(): Promise<QueueItem[]> {
    const queueQuery = query(
      this.queueRef,
      where('eventId', '==', this.eventId),
      orderBy('position', 'asc')
    );

    const snapshot = await getDocs(queueQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as QueueItem));
  }

  async addToQueue(songId: string, requestId: string): Promise<void> {
    return runTransaction(this.db, async (transaction) => {
      // Get current max position
      const lastItemQuery = query(
        this.queueRef,
        where('eventId', '==', this.eventId),
        orderBy('position', 'desc'),
        limit(1)
      );
      
      const lastItemSnapshot = await getDocs(lastItemQuery);
      const lastPosition = lastItemSnapshot.empty ? 0 : lastItemSnapshot.docs[0].data().position;

      const newQueueRef = doc(this.queueRef);
      transaction.set(newQueueRef, {
        id: newQueueRef.id,
        eventId: this.eventId,
        songId,
        requestId,
        position: lastPosition + 1,
        addedAt: serverTimestamp(),
        status: 'pending'
      });

      analyticsService.trackEvent('queue_item_added', {
        eventId: this.eventId,
        songId,
        requestId
      });
    });
  }

  async removeFromQueue(itemId: string): Promise<void> {
    const itemRef = doc(this.queueRef, itemId);
    const itemDoc = await getDoc(itemRef);

    if (!itemDoc.exists()) {
      throw new AppError({
        code: 'NOT_FOUND',
        message: 'Queue item not found',
        context: { itemId }
      });
    }

    await deleteDoc(itemRef);

    analyticsService.trackEvent('queue_item_removed', {
      eventId: this.eventId,
      itemId
    });
  }

  async reorderQueue(newOrder: string[]): Promise<void> {
    const batch = writeBatch(this.db);

    newOrder.forEach((itemId, index) => {
      const itemRef = doc(this.queueRef, itemId);
      batch.update(itemRef, {
        position: index,
        updatedAt: serverTimestamp()
      });
    });

    await batch.commit();

    analyticsService.trackEvent('queue_reordered', {
      eventId: this.eventId,
      itemCount: newOrder.length
    });
  }

  async updateItemStatus(itemId: string, status: QueueItem['status']): Promise<void> {
    const itemRef = doc(this.queueRef, itemId);
    
    await updateDoc(itemRef, {
      status,
      updatedAt: serverTimestamp(),
      ...(status === 'playing' && { playedAt: serverTimestamp() })
    });

    analyticsService.trackEvent('queue_item_status_updated', {
      eventId: this.eventId,
      itemId,
      status
    });
  }

  subscribeToQueue(callback: (queue: QueueItem[]) => void): () => void {
    const queueQuery = query(
      this.queueRef,
      where('eventId', '==', this.eventId),
      orderBy('position', 'asc')
    );

    return onSnapshot(queueQuery, (snapshot: QuerySnapshot<DocumentData>) => {
      const queue = snapshot.docs.map((doc: DocumentSnapshot<DocumentData>) => ({
        id: doc.id,
        ...doc.data()
      } as QueueItem));
      callback(queue);
    });
  }

  async cleanup(): Promise<void> {
    const batch = writeBatch(this.db);
    const queueQuery = query(this.queueRef, where('eventId', '==', this.eventId));
    const snapshot = await getDocs(queueQuery);

    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  }
} 