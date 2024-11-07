import { MetricValue, MetricThresholds, MetricReport } from '../types';
import { analyticsService } from '@/lib/firebase/services/analytics';

export class SuccessTracker {
  private metrics: Map<string, MetricValue[]>;
  private thresholds: MetricThresholds;
  private readonly RETENTION_PERIOD = 24 * 60 * 60 * 1000; // 24 hours

  constructor(thresholds: MetricThresholds) {
    this.metrics = new Map();
    this.thresholds = thresholds;
    this.startCleanupInterval();
  }

  trackMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    this.metrics.get(name)?.push({
      value,
      timestamp: Date.now()
    });

    // Track in analytics if threshold exceeded
    this.checkThreshold(name, value);
  }

  getMetricReport(): MetricReport {
    return {
      performance: this.calculatePerformanceMetrics(),
      reliability: this.calculateReliabilityMetrics(),
      userExperience: this.calculateUXMetrics()
    };
  }

  private calculatePerformanceMetrics(): PerformanceMetrics {
    const responseTime = this.getAverageMetric('responseTime');
    const memoryUsage = this.getAverageMetric('memoryUsage');
    const networkLatency = this.getAverageMetric('networkLatency');

    return {
      responseTime,
      memoryUsage,
      networkLatency,
      averages: {
        last1m: this.getAverageForPeriod('responseTime', 60 * 1000),
        last5m: this.getAverageForPeriod('responseTime', 5 * 60 * 1000),
        last15m: this.getAverageForPeriod('responseTime', 15 * 60 * 1000)
      }
    };
  }

  private calculateReliabilityMetrics(): ReliabilityMetrics {
    const uptime = this.getAverageMetric('uptime');
    const errorRate = this.getAverageMetric('errorRate');
    const syncSuccess = this.getAverageMetric('syncSuccess');

    return {
      uptime,
      errorRate,
      syncSuccess,
      incidents: {
        total: this.countMetric('incident'),
        resolved: this.countMetric('incidentResolved'),
        active: this.countMetric('incidentActive')
      }
    };
  }

  private calculateUXMetrics(): UXMetrics {
    const loadTime = this.getAverageMetric('loadTime');
    const interactionDelay = this.getAverageMetric('interactionDelay');
    const errorRecovery = this.getAverageMetric('errorRecovery');

    return {
      loadTime,
      interactionDelay,
      errorRecovery,
      satisfaction: {
        score: this.getAverageMetric('satisfactionScore'),
        responses: this.countMetric('satisfactionResponse')
      }
    };
  }

  private getAverageMetric(name: string): number {
    const values = this.metrics.get(name);
    if (!values?.length) return 0;

    const sum = values.reduce((acc, curr) => acc + curr.value, 0);
    return sum / values.length;
  }

  private getAverageForPeriod(name: string, period: number): number {
    const values = this.metrics.get(name);
    if (!values?.length) return 0;

    const now = Date.now();
    const periodValues = values.filter(v => now - v.timestamp <= period);
    
    if (!periodValues.length) return 0;
    
    const sum = periodValues.reduce((acc, curr) => acc + curr.value, 0);
    return sum / periodValues.length;
  }

  private countMetric(name: string): number {
    return this.metrics.get(name)?.length || 0;
  }

  private checkThreshold(name: string, value: number): void {
    const category = this.getMetricCategory(name);
    if (!category) return;

    const threshold = this.thresholds[category][name];
    if (value > threshold) {
      analyticsService.trackEvent('metric_threshold_exceeded', {
        metric: name,
        value,
        threshold,
        timestamp: Date.now()
      });
    }
  }

  private getMetricCategory(name: string): keyof MetricThresholds | null {
    const categories: (keyof MetricThresholds)[] = ['performance', 'reliability', 'userExperience'];
    return categories.find(category => name in this.thresholds[category]) || null;
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [name, values] of this.metrics.entries()) {
        const filtered = values.filter(v => now - v.timestamp <= this.RETENTION_PERIOD);
        this.metrics.set(name, filtered);
      }
    }, 60 * 60 * 1000); // Cleanup every hour
  }

  cleanup(): void {
    this.metrics.clear();
  }
} 