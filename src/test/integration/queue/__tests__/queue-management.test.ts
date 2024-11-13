import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { QueueManager } from '@/lib/queue/QueueManager';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import { analyticsService } from '@/lib/firebase/services/analytics';

describe('Queue Management Integration Tests', () => {
  const testEventId = 'test-event-123';
  const testUserId = 'test-user-123';
  let queueManager: QueueManager;

  beforeEach(async () => {
    queueManager = new QueueManager(testEventId);
    // Clean up existing queue items
    const queueRef = collection(db, `events/${testEventId}/queue`);
    const snapshot = await getDocs(queueRef);
    await Promise.all(snapshot.docs.map(doc => deleteDoc(doc.ref)));
  });

  afterEach(() => {
    queueManager.dispose();
  });

  it('should handle queue operations correctly', async () => {
    // Test adding to queue
    const request = {
      eventId: testEventId,
      userId: testUserId,
      song: {
        title: 'Test Song',
        artist: 'Test Artist'
      },
      status: 'pending',
      metadata: {
        requestTime: Date.now(),
        votes: 0
      }
    };

    const requestId = await queueManager.addToQueue(request);
    expect(requestId).toBeTruthy();

    // Test queue position
    const position = await queueManager.getQueuePosition(requestId);
    expect(position).toBe(1);

    // Test queue subscription
    let receivedQueue: any[] = [];
    const unsubscribe = queueManager.subscribeToQueue((queue) => {
      receivedQueue = queue;
    });

    // Wait for subscription to fire
    await new Promise(resolve => setTimeout(resolve, 1000));
    expect(receivedQueue.length).toBe(1);
    expect(receivedQueue[0].song.title).toBe('Test Song');

    // Test reordering
    const request2 = { ...request, song: { ...request.song, title: 'Test Song 2' } };
    const request2Id = await queueManager.addToQueue(request2);
    await queueManager.reorderQueue([request2Id, requestId]);

    const position1 = await queueManager.getQueuePosition(requestId);
    const position2 = await queueManager.getQueuePosition(request2Id);
    expect(position2).toBeLessThan(position1);

    // Cleanup
    unsubscribe();
  });

  it('should handle errors gracefully', async () => {
    try {
      await queueManager.getQueuePosition('non-existent-id');
    } catch (error) {
      expect(analyticsService.trackError).toHaveBeenCalled();
    }
  });

  it('should track analytics events', async () => {
    const request = {
      eventId: testEventId,
      userId: testUserId,
      song: { title: 'Test Song', artist: 'Test Artist' },
      status: 'pending',
      metadata: { requestTime: Date.now(), votes: 0 }
    };

    await queueManager.addToQueue(request);

    expect(analyticsService.trackEvent).toHaveBeenCalledWith(
      'queue_item_added',
      expect.objectContaining({
        eventId: testEventId
      })
    );
  });
}); 