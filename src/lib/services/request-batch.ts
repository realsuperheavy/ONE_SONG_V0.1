import { db } from '@/lib/firebase/config';
import { writeBatch, doc } from 'firebase/firestore';
import type { SongRequest } from '@/types/models';

export class RequestBatchService {
  private batch = writeBatch(db);
  private requests: SongRequest[] = [];
  private maxBatchSize = 500;

  async addRequest(eventId: string, request: SongRequest): Promise<void> {
    if (this.requests.length >= this.maxBatchSize) {
      await this.commitBatch();
    }

    const requestRef = doc(db, `events/${eventId}/requests/${request.id}`);
    this.batch.set(requestRef, request);
    this.requests.push(request);
  }

  async commitBatch(): Promise<void> {
    if (this.requests.length === 0) return;

    try {
      await this.batch.commit();
      this.requests = [];
      this.batch = writeBatch(db);
    } catch (error) {
      console.error('Failed to commit batch:', error);
      throw error;
    }
  }
} 