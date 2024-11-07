import { LoadTestRunner } from '../load-testing';
import { analyticsService } from '@/lib/firebase/services/analytics';

describe('Load Testing Suite', () => {
  const config = {
    users: 50,
    duration: 60000, // 1 minute
    rampUp: 10000,   // 10 seconds
    thinkTime: 1000  // 1 second
  };

  let runner: LoadTestRunner;

  beforeEach(() => {
    runner = new LoadTestRunner(config);
  });

  it('should handle concurrent users within performance targets', async () => {
    const metrics = await runner.runTest();

    // Assert performance targets
    expect(metrics.averageResponseTime).toBeLessThan(200);
    expect(metrics.p95ResponseTime).toBeLessThan(500);
    expect(metrics.errorRate).toBeLessThan(0.01);

    // Track results
    analyticsService.trackEvent('load_test_completed', {
      metrics,
      config,
      timestamp: Date.now()
    });
  }, 120000); // 2 minute timeout

  it('should maintain system stability under load', async () => {
    const heavyConfig = { ...config, users: 100 };
    const heavyRunner = new LoadTestRunner(heavyConfig);
    
    const metrics = await heavyRunner.runTest();

    // Assert system stability
    expect(metrics.successfulRequests).toBeGreaterThan(0);
    expect(metrics.errorRate).toBeLessThan(0.05);

    analyticsService.trackEvent('stability_test_completed', {
      metrics,
      config: heavyConfig,
      timestamp: Date.now()
    });
  }, 180000); // 3 minute timeout
}); 