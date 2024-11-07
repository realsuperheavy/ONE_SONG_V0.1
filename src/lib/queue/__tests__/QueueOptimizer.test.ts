import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueueOptimizer } from '../QueueOptimizer';
import { queueService } from '@/lib/firebase/services/queue';
import { analyticsService } from '@/lib/firebase/services/analytics';
import { Monitor } from '@/lib/monitoring/Monitor';

// Mock dependencies
vi.mock('@/lib/firebase/services/queue');
vi.mock('@/lib/firebase/services/analytics');
vi.mock('@/lib/monitoring/Monitor');

describe('QueueOptimizer', () => {
  let queueOptimizer: QueueOptimizer;
  let mockMonitor: Monitor;

  const mockConfig = {
    maxCacheSize: 100,
    ttl: 60000,
    batchSize: 5
  };

  const mockQueueItems = [
    { id: '1', queuePosition: 0, eventId: 'event1' },
    { id: '2', queuePosition: 1, eventId: 'event1' },
    { id: '3', queuePosition: 2, eventId: 'event1' },
    { id: '4', queuePosition: 3, eventId: 'event1' },
    { id: '5', queuePosition: 4, eventId: 'event1' },
    { id: '6', queuePosition: 5, eventId: 'event1' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockMonitor = new Monitor();
    queueOptimizer = new QueueOptimizer({ ...mockConfig, monitor: mockMonitor });
  });

  describe('processQueueBatch', () => {
    it('should process queue items in batches', async () => {
      await queueOptimizer.processQueueBatch('event1', mockQueueItems);

      // Should create two batches (5 items and 1 item)
      expect(queueService.updateBatch).toHaveBeenCalledTimes(2);
      expect(mockMonitor.trackMetric).toHaveBeenCalledWith('processedItems', 6);
    });

    it('should handle queue collisions', async () => {
      // Start first batch processing
      const firstProcess = queueOptimizer.processQueueBatch('event1', mockQueueItems);
      
      // Try to process same event queue while first is running
      const secondProcess = queueOptimizer.processQueueBatch('event1', mockQueueItems);
      
      await Promise.all([firstProcess, secondProcess]);

      expect(mockMonitor.trackMetric).toHaveBeenCalledWith('queueCollision', 1);
      expect(queueService.updateBatch).toHaveBeenCalledTimes(2); // Only first process should execute
    });

    it('should track processing time', async () => {
      const startTime = Date.now();
      await queueOptimizer.processQueueBatch('event1', mockQueueItems);
      
      expect(mockMonitor.trackMetric).toHaveBeenCalledWith(
        'processingTime',
        expect.any(Number)
      );
      
      const processingTimeCall = vi.mocked(mockMonitor.trackMetric).mock.calls
        .find(call => call[0] === 'processingTime');
      expect(processingTimeCall![1]).toBeGreaterThanOrEqual(0);
    });
  });

  describe('error handling', () => {
    it('should retry failed batches', async () => {
      // Make first attempt fail
      vi.mocked(queueService.updateBatch)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(undefined);

      await queueOptimizer.processQueueBatch('event1', mockQueueItems.slice(0, 2));

      expect(queueService.updateBatch).toHaveBeenCalledTimes(2);
      expect(mockMonitor.trackMetric).toHaveBeenCalledWith('batchError', 1);
    });

    it('should handle individual items when batch fails', async () => {
      // Make batch update fail but individual updates succeed
      vi.mocked(queueService.updateBatch)
        .mockRejectedValueOnce(new Error('Batch error'))
        .mockResolvedValue(undefined);

      await queueOptimizer.processQueueBatch('event1', mockQueueItems.slice(0, 2));

      // Should try batch once, then individual items
      expect(queueService.updateBatch).toHaveBeenCalledTimes(3);
      expect(analyticsService.trackError).toHaveBeenCalledTimes(1);
    });
  });

  describe('caching', () => {
    it('should cache processed batches', async () => {
      const items = mockQueueItems.slice(0, 2);
      
      // Process same batch twice
      await queueOptimizer.processQueueBatch('event1', items);
      await queueOptimizer.processQueueBatch('event1', items);

      expect(queueService.updateBatch).toHaveBeenCalledTimes(1);
      expect(mockMonitor.trackMetric).toHaveBeenCalledWith('cacheHit', 1);
    });

    it('should respect cache TTL', async () => {
      const items = mockQueueItems.slice(0, 2);
      
      // Process batch
      await queueOptimizer.processQueueBatch('event1', items);
      
      // Fast-forward time past TTL
      vi.advanceTimersByTime(mockConfig.ttl + 1000);
      
      // Process same batch again
      await queueOptimizer.processQueueBatch('event1', items);

      expect(queueService.updateBatch).toHaveBeenCalledTimes(2);
    });
  });

  describe('metrics', () => {
    it('should provide accurate metrics', async () => {
      await queueOptimizer.processQueueBatch('event1', mockQueueItems);

      const metrics = queueOptimizer.getMetrics();

      expect(metrics).toEqual({
        processingTime: expect.any(Number),
        errorRate: expect.any(Number),
        cacheHitRate: expect.any(Number),
        throughput: expect.any(Number)
      });
    });

    it('should track queue metrics in analytics', async () => {
      await queueOptimizer.processQueueBatch('event1', mockQueueItems);

      expect(analyticsService.trackQueueMetrics).toHaveBeenCalledWith({
        eventId: 'event1',
        queueLength: mockQueueItems.length,
        averageWaitTime: expect.any(Number),
        totalProcessed: mockQueueItems.length
      });
    });
  });
}); 