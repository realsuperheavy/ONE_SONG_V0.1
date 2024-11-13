import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import type { QueueItem } from '@/types/models';

export class QueuePositionService {
  static async estimateWaitTime(eventId: string, requestId: string): Promise<number> {
    const queueRef = collection(db, `events/${eventId}/queue`);
    const queueQuery = query(
      queueRef,
      where('status', '==', 'pending'),
      orderBy('queuePosition')
    );

    const snapshot = await getDocs(queueQuery);
    const queueItems = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as QueueItem[];

    const position = queueItems.findIndex(item => item.id === requestId);
    if (position === -1) return 0;

    // Estimate 3 minutes per song
    return position * 180000; // Return milliseconds
  }
} 