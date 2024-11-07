import { Cache } from '@/lib/cache';
import { QueueItem } from '@/lib/firebase/services/queue';
import { queueService } from '@/lib/firebase/services/queue';
import { analyticsService } from '@/lib/firebase/services/analytics';
import { Monitor } from '@/lib/monitoring/Monitor';

export class QueueOptimizer {
  private cache: Cache<QueueItem[]>;
  private batchSize: number;
  private processingQueue: Set<string>;
  private monitor: Monitor;
  private retryAttempts: number = 3;
  private retryDelay: number = 1000; // 1 second

  constructor(config: { 
    maxCacheSize: number; 
    ttl: number; 
    batchSize: number;
    monitor?: Monitor;
  }) {
    this.cache = new Cache({ maxSize: config.maxCacheSize, ttl: config.ttl });
    this.batchSize = config.batchSize;
    this.processingQueue = new Set();
    this.monitor = config.monitor || new Monitor();

    // Set up monitoring thresholds
    this.monitor.setThreshold('processingTime', 5000); // 5 seconds
    this.monitor.setThreshold('batchSize', this.batchSize * 2);
    this.monitor.setThreshold('errorRate', 0.1); // 10% error rate
  }

  async processQueueBatch(eventId: string, items: QueueItem[]): Promise<void> {
    if (this.processingQueue.has(eventId)) {
      this.monitor.trackMetric('queueCollision', 1);
      return;
    }

    const startTime = Date.now();
    let processedCount = 0;
    let errorCount = 0;

    try {
      this.processingQueue.add(eventId);
      const batches = this.createBatches(items);
      
      for (const batch of batches) {
        try {
          await this.processBatch(eventId, batch);
          processedCount += batch.length;
        } catch (error) {
          errorCount += 1;
          this.monitor.trackMetric('batchError', 1);
          await this.handleBatchError(eventId, batch, error);
        }
      }

      // Track metrics
      const processingTime = Date.now() - startTime;
      this.monitor.trackMetric('processingTime', processingTime);
      this.monitor.trackMetric('processedItems', processedCount);
      
      // Track analytics
      await analyticsService.trackQueueMetrics({
        eventId,
        queueLength: items.length,
        averageWaitTime: processingTime / processedCount,
        totalProcessed: processedCount
      });

    } finally {
      this.processingQueue.delete(eventId);
    }
  }

  private createBatches(items: QueueItem[]): QueueItem[][] {
    const batches: QueueItem[][] = [];
    for (let i = 0; i < items.length; i += this.batchSize) {
      batches.push(items.slice(i, i + this.batchSize));
    }
    return batches;
  }

  private async processBatch(eventId: string, batch: QueueItem[]): Promise<void> {
    const cacheKey = this.getBatchCacheKey(eventId, batch);
    const cachedResult = this.cache.get(cacheKey);

    if (cachedResult) {
      this.monitor.trackMetric('cacheHit', 1);
      return;
    }

    let attempt = 0;
    while (attempt < this.retryAttempts) {
      try {
        // Update queue positions
        const updates = batch.map((item, index) => ({
          ...item,
          queuePosition: item.queuePosition + index
        }));

        // Process batch with queue service
        await queueService.updateBatch(eventId, updates);
        
        // Cache successful result
        this.cache.set(cacheKey, batch);
        
        // Track successful processing
        this.monitor.trackMetric('batchSuccess', 1);
        return;

      } catch (error) {
        attempt++;
        if (attempt === this.retryAttempts) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
      }
    }
  }

  private async handleBatchError(eventId: string, batch: QueueItem[], error: any): Promise<void> {
    // Log error
    analyticsService.trackError(error, {
      eventId,
      batchSize: batch.length,
      firstItemId: batch[0].id,
      lastItemId: batch[batch.length - 1].id
    });

    // If batch size is > 1, try processing items individually
    if (batch.length > 1) {
      for (const item of batch) {
        try {
          await this.processBatch(eventId, [item]);
        } catch (itemError) {
          // Log individual item error
          analyticsService.trackError(itemError, {
            eventId,
            itemId: item.id,
            recoveryAttempt: true
          });
        }
      }
    }
  }

  private getBatchCacheKey(eventId: string, batch: QueueItem[]): string {
    const itemIds = batch.map(item => item.id).join('-');
    return `${eventId}:${itemIds}`;
  }

  // Public methods for monitoring
  public getMetrics() {
    return {
      processingTime: this.monitor.getMetricAverage('processingTime', 60000), // Last minute
      errorRate: this.monitor.getMetricAverage('batchError', 300000), // Last 5 minutes
      cacheHitRate: this.monitor.getMetricAverage('cacheHit', 300000),
      throughput: this.monitor.getMetricAverage('processedItems', 60000)
    };
  }
} 