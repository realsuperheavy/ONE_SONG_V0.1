import { PerformanceObserver, performance } from 'perf_hooks';
import { logger } from '@/lib/utils/logger';

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private marks: Map<string, number>;

  private constructor() {
    this.marks = new Map();
    this.setupObserver();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private setupObserver() {
    const obs = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        logger.info('Performance Entry:', {
          name: entry.name,
          duration: entry.duration,
          startTime: entry.startTime,
          entryType: entry.entryType
        });
      });
    });
    
    obs.observe({ entryTypes: ['measure'] });
  }

  startMeasure(name: string) {
    this.marks.set(name, performance.now());
  }

  endMeasure(name: string) {
    const startTime = this.marks.get(name);
    if (startTime) {
      const duration = performance.now() - startTime;
      performance.measure(name, {
        start: startTime,
        duration
      });
      this.marks.delete(name);
      return duration;
    }
    return null;
  }
} 