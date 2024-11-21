import { MetricsClient } from './MetricsClient';
import { Logger } from '../utils/logger';

interface MetricData {
  type: string;
  timestamp: number;
  [key: string]: any;
}

interface OperationTiming {
  startTime: number;
  name: string;
}

export class PerformanceMetricsCollector {
  private operations: Map<string, OperationTiming> = new Map();
  private readonly metrics: MetricsClient;
  private readonly logger: Logger;

  constructor() {
    this.metrics = new MetricsClient('charts');
    this.logger = new Logger('PerformanceMetrics');
  }

  startOperation(name: string): void {
    this.operations.set(name, {
      startTime: performance.now(),
      name
    });
  }

  endOperation(name: string): void {
    const operation = this.operations.get(name);
    if (operation) {
      const duration = performance.now() - operation.startTime;
      this.metrics.timing(name, duration);
      this.operations.delete(name);
    }
  }

  trackMetric(name: string, data: MetricData): void {
    this.metrics.track(name, {
      ...data,
      timestamp: data.timestamp || Date.now()
    });
  }

  dispose(): void {
    this.operations.forEach((operation) => {
      this.logger.warn(`Operation ${operation.name} was not properly ended`);
    });
    this.operations.clear();
  }
} 