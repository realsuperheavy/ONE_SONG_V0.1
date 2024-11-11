import { test, expect } from '@playwright/test';
import { initializeTestEnvironment } from '../e2e/utils/test-environment';
import { generateTestUser, generateTestEvent } from '../e2e/utils/test-data';
import { performance } from 'perf_hooks';

interface PerformanceMetrics {
  responseTimes: number[];
  errors: Error[];
  concurrentUsers: number;
  totalRequests: number;
  successRate: number;
}

class LoadTestRunner {
  private metrics: PerformanceMetrics = {
    responseTimes: [],
    errors: [],
    concurrentUsers: 0,
    totalRequests: 0,
    successRate: 0
  };

  async runLoadTest(options: {
    users: number;
    duration: number;
    rampUpTime: number;
  }) {
    const startTime = performance.now();
    const userPromises: Promise<void>[] = [];

    // Gradually ramp up users
    const userInterval = options.rampUpTime / options.users;
    
    for (let i = 0; i < options.users; i++) {
      await new Promise(resolve => setTimeout(resolve, userInterval));
      this.metrics.concurrentUsers++;
      userPromises.push(this.simulateUser(i));
    }

    await Promise.all(userPromises);
    
    this.calculateMetrics();
    return this.metrics;
  }

  private async simulateUser(userId: number) {
    const testEnv = await initializeTestEnvironment();
    const user = await generateTestUser('attendee');
    const event = await generateTestEvent('dj-1');

    try {
      await this.executeUserActions(userId);
      this.metrics.totalRequests++;
    } catch (error) {
      this.metrics.errors.push(error as Error);
    } finally {
      await testEnv.cleanup();
    }
  }

  private async executeUserActions(userId: number) {
    const actions = [
      this.searchTracks,
      this.makeRequest,
      this.voteRequest,
      this.checkQueue
    ];

    for (const action of actions) {
      const start = performance.now();
      try {
        await action(userId);
        this.metrics.responseTimes.push(performance.now() - start);
      } catch (error) {
        this.metrics.errors.push(error as Error);
      }
    }
  }

  private calculateMetrics() {
    const totalRequests = this.metrics.totalRequests;
    const successfulRequests = totalRequests - this.metrics.errors.length;
    this.metrics.successRate = (successfulRequests / totalRequests) * 100;
  }
}

test('Performance under load', async () => {
  const runner = new LoadTestRunner();
  const metrics = await runner.runLoadTest({
    users: 100,
    duration: 60000, // 1 minute
    rampUpTime: 30000 // 30 seconds
  });

  // Assert performance requirements
  expect(metrics.successRate).toBeGreaterThan(95); // 95% success rate
  
  const avgResponseTime = metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length;
  expect(avgResponseTime).toBeLessThan(1000); // Under 1 second average
  
  const p95ResponseTime = metrics.responseTimes.sort((a, b) => a - b)[Math.floor(metrics.responseTimes.length * 0.95)];
  expect(p95ResponseTime).toBeLessThan(2000); // 95th percentile under 2 seconds
}); 