import { Reporter } from '@playwright/test/reporter';
import { FullResult, TestResult } from '@playwright/test';
import fs from 'fs';
import path from 'path';

interface PerformanceMetrics {
  responseTimes: {
    avg: number;
    p95: number;
    p99: number;
    max: number;
  };
  errorRate: number;
  throughput: number;
  concurrentUsers: number;
}

export default class PerformanceReporter implements Reporter {
  private metrics: PerformanceMetrics[] = [];
  private startTime: number = Date.now();

  onTestEnd(test: TestResult) {
    if (test.status === 'passed') {
      // Extract performance metrics from test results
      const metrics = this.extractMetrics(test);
      this.metrics.push(metrics);
    }
  }

  async onEnd(result: FullResult) {
    const duration = Date.now() - this.startTime;
    const report = this.generateReport(duration);
    
    // Save report
    const reportPath = path.join(process.cwd(), 'performance-report');
    if (!fs.existsSync(reportPath)) {
      fs.mkdirSync(reportPath);
    }
    
    fs.writeFileSync(
      path.join(reportPath, 'performance.json'),
      JSON.stringify(report, null, 2)
    );

    // Generate HTML report
    const html = this.generateHtmlReport(report);
    fs.writeFileSync(
      path.join(reportPath, 'performance.html'),
      html
    );
  }

  private extractMetrics(test: TestResult): PerformanceMetrics {
    const responseTimes = test.attachments
      .filter(a => a.name === 'response-time')
      .map(a => Number(a.body));

    return {
      responseTimes: {
        avg: this.calculateAverage(responseTimes),
        p95: this.calculatePercentile(responseTimes, 95),
        p99: this.calculatePercentile(responseTimes, 99),
        max: Math.max(...responseTimes)
      },
      errorRate: test.status === 'failed' ? 1 : 0,
      throughput: test.duration / 1000,
      concurrentUsers: test.attachments
        .find(a => a.name === 'concurrent-users')
        ?.body as number ?? 0
    };
  }

  private generateReport(duration: number) {
    return {
      timestamp: new Date().toISOString(),
      duration,
      metrics: this.metrics,
      summary: this.calculateSummary()
    };
  }

  private calculateSummary() {
    // Calculate aggregate metrics
    const totalTests = this.metrics.length;
    const avgResponseTime = this.calculateAverage(
      this.metrics.map(m => m.responseTimes.avg)
    );
    const errorRate = this.calculateAverage(
      this.metrics.map(m => m.errorRate)
    );

    return {
      totalTests,
      avgResponseTime,
      errorRate,
      status: this.determineStatus(avgResponseTime, errorRate)
    };
  }

  private determineStatus(avgResponseTime: number, errorRate: number): 'pass' | 'warn' | 'fail' {
    if (errorRate > 0.05 || avgResponseTime > 2000) return 'fail';
    if (errorRate > 0.01 || avgResponseTime > 1000) return 'warn';
    return 'pass';
  }

  // Utility functions
  private calculateAverage(numbers: number[]): number {
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }

  private calculatePercentile(numbers: number[], percentile: number): number {
    const sorted = [...numbers].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }
} 