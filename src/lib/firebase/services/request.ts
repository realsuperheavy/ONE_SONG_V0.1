import { ref, push, update, remove, onValue, get, query, orderByChild, increment } from '@firebase/database';
import { rtdb } from '../config';
import { SongRequest } from '@/types/models';
import { DatabaseReference, DataSnapshot } from '@firebase/database';

interface RequestServiceConfig {
  maxVotesPerUser: number;
  voteCooldown: number; // in milliseconds
}

interface RequestUpdate {
  status?: SongRequest['status'];
  metadata?: Partial<SongRequest['metadata']>;
}

export const requestService = {
  createRequest: async (request: Omit<SongRequest, 'id' | 'status'>): Promise<string> => {
    const requestRef = ref(rtdb, `requests/${request.eventId}`);
    const newRequest: Omit<SongRequest, 'id'> = {
      ...request,
      status: 'pending',
      metadata: {
        requestTime: Date.now(),
        votes: 0
      }
    };
    
    const newRequestRef = await push(requestRef, newRequest);
    return newRequestRef.key!;
  },

  updateRequest: async (
    requestId: string, 
    eventId: string, 
    updates: RequestUpdate
  ): Promise<void> => {
    const requestRef = ref(rtdb, `requests/${eventId}/${requestId}`);
    await update(requestRef, updates);
  },

  deleteRequest: async (requestId: string, eventId: string) => {
    const requestRef = ref(rtdb, `requests/${eventId}/${requestId}`);
    await remove(requestRef);
  },

  voteRequest: async (requestId: string, eventId: string, userId: string) => {
    const requestRef = ref(rtdb, `requests/${eventId}/${requestId}`);
    const votesRef = ref(rtdb, `votes/${requestId}/${userId}`);
    
    const snapshot = await get(votesRef);
    if (snapshot.exists()) {
      throw new Error('User has already voted for this request');
    }

    const updates: { [key: string]: any } = {};
    updates[`votes/${requestId}/${userId}`] = true;
    updates[`requests/${eventId}/${requestId}/metadata/votes`] = increment(1);
    
    await update(ref(rtdb), updates);
  },

  subscribeToRequests: (eventId: string, callback: (requests: SongRequest[]) => void) => {
    const requestsRef = query(
      ref(rtdb, `requests/${eventId}`),
      orderByChild('metadata/requestTime')
    );

    const unsubscribe = onValue(requestsRef, (snapshot) => {
      const requests: SongRequest[] = [];
      snapshot.forEach((childSnapshot) => {
        requests.push({
          id: childSnapshot.key!,
          ...childSnapshot.val()
        });
      });
      callback(requests);
    });

    return unsubscribe;
  },

  getRequest: async (requestId: string, eventId: string) => {
    const requestRef = ref(rtdb, `requests/${eventId}/${requestId}`);
    const snapshot = await get(requestRef);
    if (!snapshot.exists()) {
      throw new Error('Request not found');
    }
    return {
      id: snapshot.key!,
      ...snapshot.val()
    } as SongRequest;
  }
}; 