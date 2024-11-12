import { ref, set, serverTimestamp } from '@firebase/database';
import { rtdb } from '@/lib/firebase/config';
import { analyticsService } from '@/lib/firebase/services/analytics';
import { AlertSystem } from '@/lib/analytics/AlertSystem';
import { CustomMetricsManager } from '@/lib/analytics/CustomMetricsManager';
import { Cache } from '@/lib/cache';

interface PerformanceMetrics {
  responseTime: number;
  cpuUsage: number;
  memoryUsage: number;
  errorRate: number;
  requestCount: number;
}

interface PerformanceThresholds {
  responseTime: number;
  cpuUsage: number;
  memoryUsage: number;
  errorRate: number;
}

export class PerformanceMonitor {
  private readonly eventId: string;
  private readonly alertSystem: AlertSystem;
  private readonly metricsManager: CustomMetricsManager;
  private readonly metricsCache: Cache<PerformanceMetrics>;
  private readonly thresholds: PerformanceThresholds;

  constructor(eventId: string, thresholds?: Partial<PerformanceThresholds>) {
    this.eventId = eventId;
    this.alertSystem = new AlertSystem();
    this.metricsManager = new CustomMetricsManager();
    this.metricsCache = new Cache<PerformanceMetrics>({ maxSize: 1000 });
    
    this.thresholds = {
      responseTime: thresholds?.responseTime || 1000, // 1 second
      cpuUsage: thresholds?.cpuUsage || 80, // 80%
      memoryUsage: thresholds?.memoryUsage || 85, // 85%
      errorRate: thresholds?.errorRate || 0.05 // 5%
    };

    this.initializeAlertRules();
  }

  /**
   * Initialize performance-related alert rules
   */
  private initializeAlertRules(): void {
    this.alertSystem.registerRule({
      id: 'high_response_time',
      name: 'High Response Time',
      description: 'Response time exceeded threshold',
      condition: async () => {
        const metrics = await this.getCurrentMetrics();
        return metrics.responseTime > this.thresholds.responseTime;
      },
      severity: 'warning',
      throttleMs: 60000 // 1 minute
    });

    this.alertSystem.registerRule({
      id: 'high_error_rate',
      name: 'High Error Rate',
      description: 'Error rate exceeded threshold',
      condition: async () => {
        const metrics = await this.getCurrentMetrics();
        return metrics.errorRate > this.thresholds.errorRate;
      },
      severity: 'error',
      throttleMs: 300000 // 5 minutes
    });
  }

  /**
   * Record performance metrics
   */
  async recordMetrics(metrics: Partial<PerformanceMetrics>): Promise<void> {
    try {
      const timestamp = Date.now();
      const currentMetrics = await this.getCurrentMetrics();
      const updatedMetrics = { ...currentMetrics, ...metrics };

      // Store in cache
      await this.metricsCache.set(timestamp.toString(), updatedMetrics);

      // Store in database
      const metricsRef = ref(rtdb, `performance/${this.eventId}/${timestamp}`);
      await set(metricsRef, {
        ...updatedMetrics,
        timestamp: serverTimestamp()
      });

      // Track in analytics
      analyticsService.trackEvent('performance_metrics_recorded', {
        eventId: this.eventId,
        metrics: updatedMetrics
      });

      // Check thresholds
      await this.checkThresholds(updatedMetrics);
    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'record_performance_metrics',
        eventId: this.eventId
      });
      throw error;
    }
  }

  /**
   * Get current performance metrics
   */
  private async getCurrentMetrics(): Promise<PerformanceMetrics> {
    const defaultMetrics: PerformanceMetrics = {
      responseTime: 0,
      cpuUsage: 0,
      memoryUsage: 0,
      errorRate: 0,
      requestCount: 0
    };

    const cachedMetrics = await this.metricsCache.get('latest');
    return cachedMetrics || defaultMetrics;
  }

  /**
   * Check performance thresholds and trigger alerts if needed
   */
  private async checkThresholds(metrics: PerformanceMetrics): Promise<void> {
    await Promise.all([
      this.alertSystem.checkRules('high_response_time'),
      this.alertSystem.checkRules('high_error_rate')
    ]);

    // Record threshold violations in metrics
    if (metrics.responseTime > this.thresholds.responseTime) {
      await this.metricsManager.recordMetric('response_time_violations', 1);
    }
    if (metrics.errorRate > this.thresholds.errorRate) {
      await this.metricsManager.recordMetric('error_rate_violations', 1);
    }
  }

  /**
   * Generate performance report
   */
  async generateReport(timeRange: { start: number; end: number }): Promise<PerformanceMetrics> {
    try {
      const metrics = await this.metricsManager.getMetrics(
        ['responseTime', 'cpuUsage', 'memoryUsage', 'errorRate', 'requestCount'],
        timeRange
      );

      return {
        responseTime: metrics.responseTime.avg || 0,
        cpuUsage: metrics.cpuUsage.avg || 0,
        memoryUsage: metrics.memoryUsage.avg || 0,
        errorRate: metrics.errorRate.avg || 0,
        requestCount: metrics.requestCount.sum || 0
      };
    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'generate_performance_report',
        eventId: this.eventId
      });
      throw error;
    }
  }
} 