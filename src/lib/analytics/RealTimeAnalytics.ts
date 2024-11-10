import { ref, onValue, serverTimestamp } from '@firebase/database';
import { rtdb } from '@/lib/firebase/config';
import { analyticsService } from '@/lib/firebase/services/analytics';
import { AlertSystem, AlertRule } from '@/lib/analytics/AlertSystem';
import { CustomMetricsManager } from '@/lib/analytics/CustomMetricsManager';

interface AnalyticsConfig {
  eventId: string;
  alertThresholds?: {
    errorRate?: number;
    responseTime?: number;
    queueSize?: number;
  };
  metricConfigs?: {
    retention?: number;  // Data retention in days
    sampleRate?: number; // Sampling rate (0-1)
  };
}

export class RealTimeAnalytics {
  private readonly eventId: string;
  private readonly alertSystem: AlertSystem;
  private readonly metricsManager: CustomMetricsManager;
  private listeners: Map<string, () => void> = new Map();

  constructor(config: AnalyticsConfig) {
    this.eventId = config.eventId;
    this.alertSystem = new AlertSystem();
    this.metricsManager = new CustomMetricsManager(config.eventId);

    this.initializeAlertRules(config.alertThresholds);
    this.initializeMetrics(config.metricConfigs);
  }

  /**
   * Initialize alert rules based on thresholds
   */
  private initializeAlertRules(thresholds: AnalyticsConfig['alertThresholds'] = {}): void {
    const rules: AlertRule[] = [
      {
        id: 'error_rate',
        name: 'High Error Rate',
        description: 'Error rate exceeded threshold',
        condition: async () => {
          const stats = await this.metricsManager.getMetricStats('error_rate', Date.now() - 300000);
          return stats.avg > (thresholds.errorRate || 0.05);
        },
        severity: 'warning',
        throttleMs: 300000 // 5 minutes
      },
      {
        id: 'response_time',
        name: 'High Response Time',
        description: 'Response time exceeded threshold',
        condition: async () => {
          const stats = await this.metricsManager.getMetricStats('response_time', Date.now() - 60000);
          return stats.avg > (thresholds.responseTime || 1000);
        },
        severity: 'warning',
        throttleMs: 60000 // 1 minute
      },
      {
        id: 'queue_size',
        name: 'Queue Size Warning',
        description: 'Queue size approaching limit',
        condition: async () => {
          const stats = await this.metricsManager.getMetricStats('queue_size', Date.now() - 60000);
          return stats.avg > (thresholds.queueSize || 45);
        },
        severity: 'warning',
        throttleMs: 120000 // 2 minutes
      }
    ];

    rules.forEach(rule => this.alertSystem.addRule(rule));
  }

  /**
   * Initialize metrics collection
   */
  private initializeMetrics(config: AnalyticsConfig['metricConfigs'] = {}): void {
    const metrics = [
      {
        name: 'error_rate',
        type: 'gauge' as const,
        description: 'Rate of errors in the system'
      },
      {
        name: 'response_time',
        type: 'histogram' as const,
        description: 'API response times',
        unit: 'ms'
      },
      {
        name: 'queue_size',
        type: 'gauge' as const,
        description: 'Current size of the request queue'
      },
      {
        name: 'request_rate',
        type: 'counter' as const,
        description: 'Rate of incoming requests'
      }
    ];

    metrics.forEach(metric => this.metricsManager.registerMetric(metric));
  }

  /**
   * Start monitoring analytics
   */
  startMonitoring(): void {
    this.alertSystem.startMonitoring();
    this.setupMetricListeners();

    analyticsService.trackEvent('analytics_monitoring_started', {
      eventId: this.eventId,
      timestamp: Date.now()
    });
  }

  /**
   * Stop monitoring analytics
   */
  stopMonitoring(): void {
    this.alertSystem.stopMonitoring();
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();

    analyticsService.trackEvent('analytics_monitoring_stopped', {
      eventId: this.eventId,
      timestamp: Date.now()
    });
  }

  /**
   * Setup real-time metric listeners
   */
  private setupMetricListeners(): void {
    // Monitor queue size
    const queueRef = ref(rtdb, `queue/${this.eventId}`);
    const queueUnsubscribe = onValue(queueRef, snapshot => {
      const queueSize = snapshot.size();
      this.metricsManager.recordMetric('queue_size', queueSize);
    });
    this.listeners.set('queue_size', queueUnsubscribe);

    // Monitor request rate
    const requestsRef = ref(rtdb, `requests/${this.eventId}`);
    const requestsUnsubscribe = onValue(requestsRef, snapshot => {
      const requestCount = snapshot.size();
      this.metricsManager.recordMetric('request_rate', requestCount);
    });
    this.listeners.set('request_rate', requestsUnsubscribe);
  }

  /**
   * Record response time metric
   */
  recordResponseTime(duration: number): void {
    this.metricsManager.recordMetric('response_time', duration);
  }

  /**
   * Record error occurrence
   */
  recordError(error: Error): void {
    this.metricsManager.recordMetric('error_rate', 1);
    analyticsService.trackError(error, {
      context: 'real_time_analytics',
      eventId: this.eventId
    });
  }
} 