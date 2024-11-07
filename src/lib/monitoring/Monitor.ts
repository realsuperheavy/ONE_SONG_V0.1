import { analyticsService } from '@/lib/firebase/services/analytics';

interface MetricPoint {
  timestamp: number;
  value: number;
}

export class Monitor {
  private metrics: Map<string, MetricPoint[]>;
  private thresholds: Map<string, number>;

  constructor() {
    this.metrics = new Map();
    this.thresholds = new Map();
  }

  trackMetric(name: string, value: number): void {
    const points = this.metrics.get(name) || [];
    points.push({ timestamp: Date.now(), value });
    this.metrics.set(name, points);

    this.checkThreshold(name, value);
  }

  setThreshold(name: string, value: number): void {
    this.thresholds.set(name, value);
  }

  private checkThreshold(name: string, value: number): void {
    const threshold = this.thresholds.get(name);
    if (threshold && value > threshold) {
      analyticsService.trackEvent('threshold_exceeded', {
        metric: name,
        value,
        threshold
      });
    }
  }

  getMetricAverage(name: string, timeWindow: number): number {
    const points = this.metrics.get(name) || [];
    const now = Date.now();
    const relevantPoints = points.filter(
      point => now - point.timestamp <= timeWindow
    );

    if (relevantPoints.length === 0) return 0;

    const sum = relevantPoints.reduce((acc, point) => acc + point.value, 0);
    return sum / relevantPoints.length;
  }
} 