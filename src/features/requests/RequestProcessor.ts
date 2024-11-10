import { db } from '@/lib/firebase/config';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  increment 
} from 'firebase/firestore';
import { analyticsService } from '@/lib/firebase/services/analytics';
import { QueueManager } from '@/features/queue/QueueManager';
import { EventManager } from '@/features/events/EventManagement';
import { SongRequest, RequestStatus } from '@/types/models';

interface RequestProcessingResult {
  success: boolean;
  requestId: string;
  error?: Error;
}

export class RequestProcessor {
  private readonly queueManager: QueueManager;
  private readonly eventManager: EventManager;

  constructor() {
    this.queueManager = new QueueManager();
    this.eventManager = new EventManager();
  }

  /**
   * Process a new song request with validation and duplicate checking
   */
  async processRequest(request: Partial<SongRequest>): Promise<RequestProcessingResult> {
    try {
      // Validate request
      this.validateRequest(request);

      // Check for duplicates
      const isDuplicate = await this.checkDuplicate(request);
      if (isDuplicate) {
        throw new Error('Duplicate request');
      }

      // Get event settings
      const event = await this.eventManager.getEvent(request.eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      // Create request document
      const requestRef = doc(collection(db, `events/${request.eventId}/requests`));
      const requestData: SongRequest = {
        id: requestRef.id,
        eventId: request.eventId,
        userId: request.userId,
        song: request.song,
        status: event.settings.requireApproval ? 'pending' : 'approved',
        metadata: {
          requestTime: new Date().toISOString(),
          message: request.metadata?.message || '',
          votes: 0
        }
      };

      await setDoc(requestRef, requestData);

      // Update event stats
      await this.updateEventStats(request.eventId);

      // Auto-approve if setting enabled
      if (!event.settings.requireApproval) {
        await this.approveRequest(requestData.id);
      }

      analyticsService.trackEvent('request_processed', {
        eventId: request.eventId,
        requestId: requestData.id,
        songId: request.song.id
      });

      return {
        success: true,
        requestId: requestData.id
      };

    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'process_request',
        request
      });
      return {
        success: false,
        requestId: null,
        error: error as Error
      };
    }
  }

  /**
   * Approve a pending request and add it to the queue
   */
  async approveRequest(requestId: string): Promise<void> {
    try {
      const request = await this.getRequest(requestId);
      if (!request) {
        throw new Error('Request not found');
      }

      if (request.status !== 'pending') {
        throw new Error('Request is not in pending state');
      }

      // Update request status
      const requestRef = doc(db, `events/${request.eventId}/requests/${requestId}`);
      await updateDoc(requestRef, {
        status: 'approved' as RequestStatus,
        updatedAt: serverTimestamp()
      });

      // Add to queue
      await this.queueManager.addToQueue(request);

      analyticsService.trackEvent('request_approved', {
        eventId: request.eventId,
        requestId: request.id
      });

    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'approve_request',
        requestId
      });
      throw error;
    }
  }

  /**
   * Get a request by ID
   */
  async getRequest(requestId: string): Promise<SongRequest | null> {
    try {
      // Find the request across all events (could be optimized with a global index)
      const eventsRef = collection(db, 'events');
      const events = await getDocs(eventsRef);

      for (const event of events.docs) {
        const requestRef = doc(event.ref, 'requests', requestId);
        const requestDoc = await getDoc(requestRef);
        
        if (requestDoc.exists()) {
          return requestDoc.data() as SongRequest;
        }
      }

      return null;
    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'get_request',
        requestId
      });
      throw error;
    }
  }

  /**
   * Validate request data
   */
  private validateRequest(request: Partial<SongRequest>): void {
    if (!request.eventId) throw new Error('Event ID is required');
    if (!request.userId) throw new Error('User ID is required');
    if (!request.song?.id) throw new Error('Song data is required');
  }

  /**
   * Check for duplicate requests
   */
  private async checkDuplicate(request: Partial<SongRequest>): Promise<boolean> {
    const requestsRef = collection(db, `events/${request.eventId}/requests`);
    const q = query(
      requestsRef,
      where('song.id', '==', request.song.id),
      where('status', 'in', ['pending', 'approved'])
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
  }

  /**
   * Update event request statistics
   */
  private async updateEventStats(eventId: string): Promise<void> {
    const eventRef = doc(db, 'events', eventId);
    await updateDoc(eventRef, {
      'stats.requestCount': increment(1),
      updatedAt: serverTimestamp()
    });
  }
} 