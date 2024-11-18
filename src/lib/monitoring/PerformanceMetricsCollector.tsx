import { analyticsService } from '@/lib/firebase/services/analytics';

export class PerformanceMetricsCollector {
  private metrics: {
    errorCount: number;
    operations: Record<string, {
      startTime?: number;
      endTime?: number;
    }>;
  };

  constructor() {
    this.metrics = {
      errorCount: 0,
      operations: {}
    };
  }

  startOperation(operation: string) {
    this.metrics.operations[operation] = {
      startTime: performance.now()
    };
  }

  endOperation(operation: string) {
    if (this.metrics.operations[operation]) {
      this.metrics.operations[operation].endTime = performance.now();
      analyticsService.trackEvent('operation_complete', {
        operation,
        duration: this.getDuration(operation)
      });
    }
  }

  recordError(operation: string, error: Error) {
    this.metrics.errorCount++;
    analyticsService.trackEvent('operation_error', {
      operation,
      error: error.message,
      totalErrors: this.metrics.errorCount
    });
  }

  private getDuration(operation: string): number {
    const op = this.metrics.operations[operation];
    if (op?.startTime && op?.endTime) {
      return op.endTime - op.startTime;
    }
    return 0;
  }

  dispose() {
    this.metrics = {
      errorCount: 0,
      operations: {}
    };
  }
}