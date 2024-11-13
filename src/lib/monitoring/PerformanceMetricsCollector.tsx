import { analyticsService } from '@/lib/firebase/services/analytics';

interface PerformanceMetrics {
    fps: number[];
    memory: number[];
    networkRequests: number;
    errorCount: number;
    interactionDelay: number[];
    operations: Map<string, { startTime: number; endTime?: number }>;
  }
  
  export class PerformanceMetricsCollector {
    private metrics: PerformanceMetrics;
    private cleanup: (() => void)[] = [];
    private originalFetch: typeof fetch;
  
    constructor() {
      this.metrics = {
        fps: [],
        memory: [],
        networkRequests: 0,
        errorCount: 0,
        interactionDelay: [],
        operations: new Map()
      };
      this.originalFetch = window.fetch;
      this.initializeMonitoring();
    }
  
    startOperation(name: string): void {
      this.metrics.operations.set(name, {
        startTime: performance.now()
      });
    }
  
    endOperation(name: string): void {
      const operation = this.metrics.operations.get(name);
      if (operation) {
        operation.endTime = performance.now();
      }
    }
  
    getMetrics(): { responseTime: number } {
      const lastOperation = Array.from(this.metrics.operations.values()).pop();
      return {
        responseTime: lastOperation && lastOperation.endTime 
          ? lastOperation.endTime - lastOperation.startTime 
          : 0
      };
    }
  
    trackError(operation: string): void {
      this.metrics.errorCount++;
      analyticsService.trackEvent('operation_error', {
        operation,
        totalErrors: this.metrics.errorCount
      });
    }
  
    recordError(operation: string, error: Error) {
      this.metrics.errorCount++;
      analyticsService.trackEvent('operation_error', {
        operation,
        error: error.message,
        totalErrors: this.metrics.errorCount
      });
    }
  
    private initializeMonitoring(): void {
      this.setupFPSMonitoring();
      this.setupMemoryMonitoring();
      this.setupNetworkMonitoring();
      this.setupInteractionMonitoring();
      this.setupPeriodicReporting();
    }
  
    private setupFPSMonitoring(): void {
      let frameCount = 0;
      let lastTime = performance.now();
  
      const measureFPS = () => {
        const now = performance.now();
        frameCount++;
  
        if (now - lastTime >= 1000) {
          const fps = Math.round((frameCount * 1000) / (now - lastTime));
          this.metrics.fps.push(fps);
          frameCount = 0;
          lastTime = now;
        }
  
        const animationFrame = requestAnimationFrame(measureFPS);
        this.cleanup.push(() => cancelAnimationFrame(animationFrame));
      };
  
      requestAnimationFrame(measureFPS);
    }
  
    private setupMemoryMonitoring(): void {
      const memoryInterval = setInterval(() => {
        if ('memory' in performance) {
          const memory = (performance as any).memory;
          const usage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
          this.metrics.memory.push(usage);
        }
      }, 30000);
  
      this.cleanup.push(() => clearInterval(memoryInterval));
    }
  
    private setupNetworkMonitoring(): void {
      window.fetch = async (...args) => {
        this.metrics.networkRequests++;
        const startTime = performance.now();
        
        try {
          const response = await this.originalFetch(...args);
          const duration = performance.now() - startTime;
          return response;
        } catch (error) {
          this.metrics.errorCount++;
          throw error;
        }
      };
    }
  
    private setupInteractionMonitoring(): void {
      const measureInteractionDelay = () => {
        const startTime = performance.now();
        
        const handler = () => {
          const delay = performance.now() - startTime;
          this.metrics.interactionDelay.push(delay);
        };
  
        document.addEventListener('click', handler, { once: true });
      };
  
      document.addEventListener('mousedown', measureInteractionDelay);
      this.cleanup.push(() => document.removeEventListener('mousedown', measureInteractionDelay));
    }
  
    private setupPeriodicReporting(): void {
      const reportInterval = setInterval(() => {
        this.reportMetrics();
      }, 60000);
  
      this.cleanup.push(() => clearInterval(reportInterval));
    }
  
    private reportMetrics(): void {
      const metrics = this.metrics;
      analyticsService.trackEvent('performance_metrics', {
        averageFPS: this.calculateAverage(metrics.fps),
        averageMemory: this.calculateAverage(metrics.memory),
        networkRequests: metrics.networkRequests,
        errorCount: metrics.errorCount,
        averageDelay: this.calculateAverage(metrics.interactionDelay)
      });
  
      // Reset metrics
      this.resetMetrics();
    }
  
    private calculateAverage(arr: number[]): number {
      return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    }
  
    private resetMetrics(): void {
      this.metrics.fps = [];
      this.metrics.memory = [];
      this.metrics.networkRequests = 0;
      this.metrics.errorCount = 0;
      this.metrics.interactionDelay = [];
    }
  
    dispose(): void {
      this.cleanup.forEach(cleanup => cleanup());
      window.fetch = this.originalFetch;
      this.metrics.operations.clear();
    }
  }