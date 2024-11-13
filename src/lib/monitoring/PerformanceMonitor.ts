import { analyticsService } from '@/lib/firebase/services/analytics';

interface PerformanceMetrics {
  responseTime: number;
  queueOperationTime: number;
  songRequestTime: number;
  errorCount: number;
  totalOperations: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private startTimes: Map<string, number> = new Map();

  private constructor() {
    // Initialize metrics
    this.metrics.set('responseTime', []);
    this.metrics.set('queueOperationTime', []);
    this.metrics.set('songRequestTime', []);
    this.metrics.set('errorCount', [0]);
    this.metrics.set('totalOperations', [0]);
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startOperation(operationType: string): void {
    this.startTimes.set(operationType, performance.now());
    this.incrementMetric('totalOperations');

    analyticsService.trackEvent('operation_started', {
      operationType,
      timestamp: Date.now()
    });
  }

  endOperation(operationType: string): void {
    const startTime = this.startTimes.get(operationType);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.addMetric(operationType, duration);
      this.startTimes.delete(operationType);

      analyticsService.trackEvent('operation_completed', {
        operationType,
        duration,
        timestamp: Date.now()
      });
    }
  }

  trackError(operationType: string): void {
    this.incrementMetric('errorCount');
    
    analyticsService.trackEvent('performance_error', {
      operationType,
      timestamp: Date.now(),
      currentMetrics: this.getMetrics()
    });
  }

  private addMetric(name: string, value: number): void {
    const metrics = this.metrics.get(name) || [];
    metrics.push(value);
    this.metrics.set(name, metrics.slice(-100)); // Keep last 100 measurements
  }

  private incrementMetric(name: string): void {
    const metrics = this.metrics.get(name) || [0];
    metrics[metrics.length - 1]++;
    this.metrics.set(name, metrics);
  }

  getMetrics(): PerformanceMetrics {
    return {
      responseTime: this.calculateAverage('responseTime'),
      queueOperationTime: this.calculateAverage('queueOperationTime'),
      songRequestTime: this.calculateAverage('songRequestTime'),
      errorCount: this.metrics.get('errorCount')?.[0] || 0,
      totalOperations: this.metrics.get('totalOperations')?.[0] || 0
    };
  }

  private calculateAverage(metricName: string): number {
    const metrics = this.metrics.get(metricName) || [];
    if (metrics.length === 0) return 0;
    return metrics.reduce((a, b) => a + b, 0) / metrics.length;
  }
} 