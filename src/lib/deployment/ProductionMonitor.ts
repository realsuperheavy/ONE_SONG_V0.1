import { analyticsService } from '@/lib/firebase/services/analytics';
import { AlertSystem } from '@/lib/analytics/AlertSystem';
import { Cache } from '@/lib/cache';

interface MonitoringMetrics {
  errorRate: number;
  responseTime: number;
  userCount: number;
  memoryUsage: number;
  cpuUsage: number;
}

export class ProductionMonitor {
  private alertSystem: AlertSystem;
  private metricsCache: Cache<MonitoringMetrics>;
  private readonly ALERT_THRESHOLDS = {
    errorRate: 0.01, // 1%
    responseTime: 1000, // 1 second
    memoryUsage: 0.9, // 90%
    cpuUsage: 0.8 // 80%
  };

  constructor() {
    this.alertSystem = new AlertSystem();
    this.metricsCache = new Cache({ maxSize: 1000, ttl: 60 * 60 * 1000 }); // 1 hour
    this.initializeAlertRules();
  }

  async monitorProduction(): Promise<void> {
    try {
      const metrics = await this.gatherMetrics();
      await this.analyzeMetrics(metrics);
      await this.storeMetrics(metrics);
      
      // Track in analytics
      analyticsService.trackEvent('production_health_check', {
        metrics,
        timestamp: Date.now()
      });
    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'production_monitoring'
      });
      throw error;
    }
  }

  private async gatherMetrics(): Promise<MonitoringMetrics> {
    const [errorRate, responseTime, userCount, memoryUsage, cpuUsage] = await Promise.all([
      this.calculateErrorRate(),
      this.measureResponseTime(),
      this.getCurrentUserCount(),
      this.getMemoryUsage(),
      this.getCPUUsage()
    ]);

    return {
      errorRate,
      responseTime,
      userCount,
      memoryUsage,
      cpuUsage
    };
  }

  private async analyzeMetrics(metrics: MonitoringMetrics): Promise<void> {
    // Check each metric against thresholds
    if (metrics.errorRate > this.ALERT_THRESHOLDS.errorRate) {
      this.alertSystem.addRule({
        id: 'high_error_rate',
        name: 'High Error Rate',
        description: `Error rate of ${metrics.errorRate * 100}% detected`,
        severity: 'critical',
        condition: () => true
      });
    }

    if (metrics.responseTime > this.ALERT_THRESHOLDS.responseTime) {
      this.alertSystem.addRule({
        id: 'slow_response_time',
        name: 'Slow Response Time',
        description: `Response time of ${metrics.responseTime}ms detected`,
        severity: 'warning',
        condition: () => true
      });
    }

    if (metrics.memoryUsage > this.ALERT_THRESHOLDS.memoryUsage) {
      this.alertSystem.addRule({
        id: 'high_memory_usage',
        name: 'High Memory Usage',
        description: `Memory usage at ${metrics.memoryUsage * 100}%`,
        severity: 'warning',
        condition: () => true
      });
    }

    if (metrics.cpuUsage > this.ALERT_THRESHOLDS.cpuUsage) {
      this.alertSystem.addRule({
        id: 'high_cpu_usage',
        name: 'High CPU Usage',
        description: `CPU usage at ${metrics.cpuUsage * 100}%`,
        severity: 'warning',
        condition: () => true
      });
    }
  }

  private async storeMetrics(metrics: MonitoringMetrics): Promise<void> {
    const timestamp = Date.now();
    this.metricsCache.set(`metrics_${timestamp}`, metrics);
  }

  private async calculateErrorRate(): Promise<number> {
    const errorLogs = await this.getErrorLogs();
    const totalRequests = await this.getTotalRequests();
    return errorLogs.length / totalRequests;
  }

  private async measureResponseTime(): Promise<number> {
    const responseTimes = await this.getResponseTimes();
    return this.average(responseTimes);
  }

  private async getCurrentUserCount(): Promise<number> {
    const snapshot = await this.getActiveUsers();
    return snapshot.size;
  }

  private async getMemoryUsage(): Promise<number> {
    if (typeof window !== 'undefined' && window.performance?.memory) {
      return window.performance.memory.usedJSHeapSize / 
             window.performance.memory.jsHeapSizeLimit;
    }
    return 0;
  }

  private async getCPUUsage(): Promise<number> {
    // Implementation would depend on server monitoring setup
    return 0;
  }

  private average(numbers: number[]): number {
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }

  cleanup(): void {
    this.metricsCache.clear();
    this.alertSystem.cleanup();
  }
} 