import { ref, onValue, serverTimestamp } from 'firebase/database';
import { rtdb } from '@/lib/firebase/config';
import { CustomMetricsManager } from './CustomMetricsManager';
import { AlertSystem } from './AlertSystem';
import { Cache } from '@/lib/cache';
import { analyticsService } from '@/lib/firebase/services/analytics';

export interface RealTimeAnalyticsConfig {
  updateInterval?: number;
  metricsManager: CustomMetricsManager;
  alertSystem: AlertSystem;
  maxRetries?: number;
  batchSize?: number;
}

export class RealTimeAnalytics {
  private metricsManager: CustomMetricsManager;
  private alertSystem: AlertSystem;
  private cache: Cache<any>;
  private listeners: Map<string, () => void>;
  private updateInterval: number;
  private readonly BATCH_SIZE = 100;

  constructor(config: RealTimeAnalyticsConfig) {
    this.metricsManager = config.metricsManager;
    this.alertSystem = config.alertSystem;
    this.cache = new Cache({ maxSize: 1000, ttl: 5 * 60 * 1000 }); // 5 minutes
    this.listeners = new Map();
    this.updateInterval = config.updateInterval || 1000; // 1 second default
    
    this.startPeriodicUpdates();
  }

  async trackEventMetrics(eventId: string): Promise<void> {
    if (this.listeners.has(eventId)) return;

    const unsubscribe = onValue(
      ref(rtdb, `events/${eventId}/metrics`),
      async (snapshot) => {
        const metrics = snapshot.val();
        if (!metrics) return;

        try {
          await this.processMetrics(eventId, metrics);
        } catch (error) {
          analyticsService.trackError(error as Error, {
            context: 'real_time_analytics',
            eventId
          });
        }
      }
    );

    this.listeners.set(eventId, unsubscribe);
  }

  async stopTracking(eventId: string): Promise<void> {
    const unsubscribe = this.listeners.get(eventId);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(eventId);
    }
  }

  private async processMetrics(eventId: string, metrics: any): Promise<void> {
    const cacheKey = `metrics_${eventId}_${Date.now()}`;
    const cachedMetrics = this.cache.get(cacheKey);

    if (cachedMetrics) {
      return;
    }

    // Process new metrics
    const processedMetrics = {
      requestRate: this.calculateRequestRate(metrics.requests),
      queueLength: metrics.queue?.length || 0,
      activeUsers: metrics.activeUsers || 0,
      errorRate: this.calculateErrorRate(metrics.errors),
      averageResponseTime: this.calculateAverageResponseTime(metrics.responseTimes)
    };

    // Track metrics
    Object.entries(processedMetrics).forEach(([key, value]) => {
      this.metricsManager.trackMetric(key, value);
    });

    // Check for alerts
    if (processedMetrics.errorRate > 0.1) { // 10% error rate threshold
      this.alertSystem.addRule({
        id: `high_error_rate_${eventId}`,
        name: 'High Error Rate',
        description: `Error rate of ${processedMetrics.errorRate * 100}% detected`,
        condition: () => processedMetrics.errorRate > 0.1,
        severity: 'error'
      });
    }

    // Cache processed metrics
    this.cache.set(cacheKey, processedMetrics);

    // Persist to analytics
    await analyticsService.trackEvent('real_time_metrics', {
      eventId,
      metrics: processedMetrics,
      timestamp: serverTimestamp()
    });
  }

  private calculateRequestRate(requests: any[]): number {
    if (!requests?.length) return 0;
    const recentRequests = requests.filter(r => 
      Date.now() - r.timestamp < 60000 // Last minute
    );
    return recentRequests.length / 60; // Requests per second
  }

  private calculateErrorRate(errors: any[]): number {
    if (!errors?.length) return 0;
    const recentErrors = errors.filter(e => 
      Date.now() - e.timestamp < 300000 // Last 5 minutes
    );
    return recentErrors.length / errors.length;
  }

  private calculateAverageResponseTime(times: number[]): number {
    if (!times?.length) return 0;
    return times.reduce((a, b) => a + b, 0) / times.length;
  }

  private startPeriodicUpdates(): void {
    setInterval(() => {
      this.listeners.forEach((_, eventId) => {
        this.processMetrics(eventId, {});
      });
    }, this.updateInterval);
  }

  cleanup(): void {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
    this.cache.clear();
  }
} 