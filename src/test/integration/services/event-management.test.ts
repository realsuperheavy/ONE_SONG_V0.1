import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EventManager } from '@/features/events/EventManagement';
import { QueueManager } from '@/features/queue/QueueManager';
import { RequestProcessor } from '@/features/requests/RequestProcessor';
import { firebaseAdmin } from '@/lib/firebase/admin';

describe('Event Management Integration', () => {
  let eventManager: EventManager;
  let queueManager: QueueManager;
  let requestProcessor: RequestProcessor;
  let eventId: string;

  beforeEach(async () => {
    eventManager = new EventManager();
    queueManager = new QueueManager();
    requestProcessor = new RequestProcessor();
    
    const event = await eventManager.initializeEvent({
      name: 'Test Event',
      djId: 'test-dj'
    });
    eventId = event.id;
  });

  afterEach(async () => {
    await firebaseAdmin.firestore()
      .collection('events')
      .doc(eventId)
      .delete();
  });

  it('handles complete request-to-queue flow', async () => {
    // Create request
    const request = await requestProcessor.processRequest({
      eventId,
      userId: 'test-user',
      song: {
        id: 'test-song',
        title: 'Test Song'
      }
    });

    // Verify request created
    expect(request.status).toBe('pending');

    // Approve request
    await requestProcessor.approveRequest(request.id);
    const updatedRequest = await requestProcessor.getRequest(request.id);
    expect(updatedRequest.status).toBe('approved');

    // Verify in queue
    const queue = await queueManager.getQueue(eventId);
    expect(queue).toContainEqual(expect.objectContaining({
      songId: 'test-song'
    }));
  });
}); 