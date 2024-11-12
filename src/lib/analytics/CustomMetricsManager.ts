import { ref, set, get, query, orderByChild, limitToLast } from '@firebase/database';
import { rtdb } from '@/lib/firebase/config';
import { analyticsService } from '@/lib/firebase/services/analytics';
import { Cache } from '@/lib/cache';

interface MetricConfig {
  name: string;
  description: string;
  aggregationType: 'sum' | 'average' | 'max' | 'min' | 'count';
  retentionDays: number;
  alertThresholds?: {
    warning?: number;
    error?: number;
    critical?: number;
  };
}

interface MetricDataPoint {
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface MetricResult {
  avg?: number;
  sum?: number;
}

interface MetricsResponse {
  [key: string]: MetricResult;
}

export class CustomMetricsManager {
  private metricsCache: Cache<MetricDataPoint[]>;
  private configs: Map<string, MetricConfig> = new Map();

  constructor() {
    this.metricsCache = new Cache<MetricDataPoint[]>({ 
      maxSize: 1000,
      ttl: 60 * 60 * 1000 // 1 hour
    });
  }

  /**
   * Register a new custom metric
   */
  registerMetric(config: MetricConfig): void {
    this.configs.set(config.name, config);
  }

  /**
   * Record a metric value
   */
  async recordMetric(name: string, value: number, metadata?: Record<string, any>): Promise<void> {
    const config = this.configs.get(name);
    if (!config) {
      throw new Error(`Metric ${name} not registered`);
    }

    const dataPoint: MetricDataPoint = {
      value,
      timestamp: Date.now(),
      metadata
    };

    try {
      // Store in Firebase RTDB
      const metricRef = ref(rtdb, `metrics/${name}/${dataPoint.timestamp}`);
      await set(metricRef, dataPoint);

      // Update cache
      const cached = await this.metricsCache.get(name) || [];
      cached.push(dataPoint);
      await this.metricsCache.set(name, cached);

      // Track in analytics
      analyticsService.trackEvent('metric_recorded', {
        metricName: name,
        value,
        metadata
      });

      // Check alert thresholds
      await this.checkThresholds(name, value);
    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'record_metric',
        metricName: name
      });
      throw error;
    }
  }

  /**
   * Get metric values for a time range
   */
  async getMetricValues(name: string, startTime: number, endTime: number): Promise<MetricDataPoint[]> {
    try {
      // Try cache first
      const cached = await this.metricsCache.get(name);
      if (cached) {
        return cached.filter(point => 
          point.timestamp >= startTime && point.timestamp <= endTime
        );
      }

      // Fetch from Firebase if not in cache
      const metricRef = ref(rtdb, `metrics/${name}`);
      const metricsQuery = query(
        metricRef,
        orderByChild('timestamp'),
        limitToLast(1000) // Adjust based on needs
      );

      const snapshot = await get(metricsQuery);
      const data = snapshot.val() || {};

      const points = Object.values(data) as MetricDataPoint[];
      const filtered = points.filter(point =>
        point.timestamp >= startTime && point.timestamp <= endTime
      );

      // Update cache
      await this.metricsCache.set(name, filtered);

      return filtered;
    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'get_metric_values',
        metricName: name
      });
      throw error;
    }
  }

  /**
   * Calculate aggregated metric value
   */
  async calculateMetricAggregate(name: string, timeRange: number): Promise<number> {
    const config = this.configs.get(name);
    if (!config) {
      throw new Error(`Metric ${name} not registered`);
    }

    const endTime = Date.now();
    const startTime = endTime - timeRange;
    const points = await this.getMetricValues(name, startTime, endTime);

    switch (config.aggregationType) {
      case 'sum':
        return points.reduce((sum, point) => sum + point.value, 0);
      case 'average':
        return points.length > 0 
          ? points.reduce((sum, point) => sum + point.value, 0) / points.length 
          : 0;
      case 'max':
        return points.length > 0 
          ? Math.max(...points.map(point => point.value))
          : 0;
      case 'min':
        return points.length > 0 
          ? Math.min(...points.map(point => point.value))
          : 0;
      case 'count':
        return points.length;
      default:
        throw new Error(`Unknown aggregation type: ${config.aggregationType}`);
    }
  }

  private async checkThresholds(name: string, value: number): Promise<void> {
    const config = this.configs.get(name);
    if (!config?.alertThresholds) return;

    const { critical, error, warning } = config.alertThresholds;

    if (critical !== undefined && value >= critical) {
      analyticsService.trackEvent('metric_threshold_exceeded', {
        metricName: name,
        threshold: 'critical',
        value
      });
    } else if (error !== undefined && value >= error) {
      analyticsService.trackEvent('metric_threshold_exceeded', {
        metricName: name,
        threshold: 'error',
        value
      });
    } else if (warning !== undefined && value >= warning) {
      analyticsService.trackEvent('metric_threshold_exceeded', {
        metricName: name,
        threshold: 'warning',
        value
      });
    }
  }

  async getMetrics(metrics: string[], timeRange: { start: number; end: number }): Promise<MetricsResponse> {
    // Implementation to fetch and aggregate metrics
    return metrics.reduce((acc, metric) => ({
      ...acc,
      [metric]: { avg: 0, sum: 0 } // Default values, replace with actual implementation
    }), {} as MetricsResponse);
  }
} 