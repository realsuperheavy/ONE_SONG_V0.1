import { db } from '../config';
import { collection, addDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { RateLimitService } from '@/lib/services/rate-limit';
import type { SongRequest } from '@/types/models';

export class EventRequestService {
  async createRequest(
    eventId: string,
    userId: string,
    request: Partial<SongRequest>
  ): Promise<string> {
    const rateLimitService = new RateLimitService(userId, eventId);
    const canRequest = await rateLimitService.checkRateLimit();

    if (!canRequest) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    const requestRef = collection(db, `events/${eventId}/requests`);
    
    const requestData: Omit<SongRequest, 'id'> = {
      eventId,
      userId,
      song: request.song!,
      status: 'pending',
      metadata: {
        requestTime: Date.now(),
        message: request.metadata?.message,
        votes: 0
      }
    };

    const docRef = await addDoc(requestRef, requestData);
    return docRef.id;
  }

  async voteForRequest(eventId: string, requestId: string, userId: string): Promise<void> {
    const requestRef = doc(db, `events/${eventId}/requests/${requestId}`);
    const request = await getDoc(requestRef);
    
    if (!request.exists()) {
      throw new Error('Request not found');
    }

    await updateDoc(requestRef, {
      'metadata.votes': (request.data() as SongRequest).metadata.votes + 1
    });
  }
} 