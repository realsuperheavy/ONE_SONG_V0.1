import { getPerformance } from '@/lib/firebase/services/analytics';
import type { PerformanceMetrics } from '@/types/analytics';

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  trackMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)?.push(value);

    getPerformance()?.measure(name, {
      detail: { value },
      start: performance.now()
    });
  }

  getMetrics(): PerformanceMetrics {
    const result: Record<string, number> = {};
    
    this.metrics.forEach((values, name) => {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      result[name] = avg;
    });

    return {
      responseTime: result.responseTime || 0,
      throughput: result.throughput || 0,
      errorRate: result.errorRate || 0
    };
  }

  clearMetrics(): void {
    this.metrics.clear();
  }
} 