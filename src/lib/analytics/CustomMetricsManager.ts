import { analyticsService } from '@/lib/firebase/services/analytics';
import { Cache } from '@/lib/cache';

interface CustomMetric {
  id: string;
  name: string;
  value: number;
  description?: string;
  threshold?: number;
  history?: number[];
  category: 'performance' | 'business' | 'user' | 'system';
  aggregation: 'sum' | 'average' | 'max' | 'min' | 'last';
  retention: number; // In milliseconds
}

export class CustomMetricsManager {
  private metrics: Map<string, CustomMetric>;
  private cache: Cache<number[]>;
  private updateInterval: number;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(config: {
    updateInterval?: number;
    cacheSize?: number;
    cacheTTL?: number;
  }) {
    this.metrics = new Map();
    this.cache = new Cache({
      maxSize: config.cacheSize || 1000,
      ttl: config.cacheTTL || 24 * 60 * 60 * 1000
    });
    this.updateInterval = config.updateInterval || 5000; // 5 seconds default
  }

  registerMetric(metric: Omit<CustomMetric, 'value' | 'history'>): void {
    this.metrics.set(metric.id, {
      ...metric,
      value: 0,
      history: []
    });
  }

  trackMetric(metricId: string, value: number): void {
    const metric = this.metrics.get(metricId);
    if (!metric) {
      console.warn(`Metric ${metricId} not registered`);
      return;
    }

    // Update current value based on aggregation type
    switch (metric.aggregation) {
      case 'sum':
        metric.value += value;
        break;
      case 'average':
        const history = metric.history || [];
        metric.value = (history.reduce((a, b) => a + b, value)) / (history.length + 1);
        break;
      case 'max':
        metric.value = Math.max(metric.value, value);
        break;
      case 'min':
        metric.value = Math.min(metric.value, value);
        break;
      case 'last':
        metric.value = value;
        break;
    }

    // Update history
    metric.history = [...(metric.history || []), value].slice(-100); // Keep last 100 values

    // Check threshold
    if (metric.threshold && value > metric.threshold) {
      analyticsService.trackEvent('metric_threshold_exceeded', {
        metricId,
        value,
        threshold: metric.threshold,
        timestamp: Date.now()
      });
    }

    // Cache the update
    this.cacheMetricValue(metricId, value);
  }

  getMetric(metricId: string): CustomMetric | undefined {
    return this.metrics.get(metricId);
  }

  getAllMetrics(): CustomMetric[] {
    return Array.from(this.metrics.values());
  }

  getMetricsByCategory(category: CustomMetric['category']): CustomMetric[] {
    return Array.from(this.metrics.values()).filter(
      metric => metric.category === category
    );
  }

  startTracking(): void {
    if (this.intervalId) return;

    this.intervalId = setInterval(() => {
      this.flushMetricsToAnalytics();
    }, this.updateInterval);
  }

  stopTracking(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async flushMetricsToAnalytics(): Promise<void> {
    const metrics = this.getAllMetrics();
    const batch = metrics.map(metric => ({
      name: metric.name,
      value: metric.value,
      category: metric.category,
      timestamp: Date.now()
    }));

    try {
      await analyticsService.trackMetricsBatch(batch);
    } catch (error) {
      console.error('Failed to flush metrics:', error);
      // Cache failed batch for retry
      this.cache.set(`failed_batch_${Date.now()}`, batch);
    }
  }

  private cacheMetricValue(metricId: string, value: number): void {
    const cacheKey = `metric_${metricId}_${Date.now()}`;
    this.cache.set(cacheKey, value);
  }

  async retryFailedUpdates(): Promise<void> {
    const failedBatches = Array.from(this.cache.entries())
      .filter(([key]) => key.startsWith('failed_batch_'));

    for (const [key, batch] of failedBatches) {
      try {
        await analyticsService.trackMetricsBatch(batch);
        this.cache.delete(key);
      } catch (error) {
        console.error(`Failed to retry batch ${key}:`, error);
      }
    }
  }
} 