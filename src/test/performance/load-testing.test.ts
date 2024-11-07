import { test, expect } from '@playwright/test';
import { LoadTester } from './utils/LoadTester';

test.describe('Performance Tests', () => {
  const loadTester = new LoadTester();

  test('handles concurrent requests within latency threshold', async () => {
    const results = await loadTester.simulateConcurrentRequests({
      users: 100,
      requestsPerUser: 5,
      endpoint: '/api/requests/create'
    });

    expect(results.averageLatency).toBeLessThan(200); // 200ms threshold
    expect(results.successRate).toBeGreaterThan(0.99); // 99% success rate
    expect(results.p95Latency).toBeLessThan(500); // 500ms p95
  });

  test('maintains real-time sync under load', async () => {
    const syncResults = await loadTester.measureRealtimeSync({
      connections: 50,
      duration: 60000, // 1 minute
      updatesPerSecond: 10
    });

    expect(syncResults.averageSyncDelay).toBeLessThan(100); // 100ms sync delay
    expect(syncResults.messageDeliveryRate).toBeGreaterThan(0.995); // 99.5% delivery
  });

  test('handles queue operations at scale', async () => {
    const queueResults = await loadTester.benchmarkQueueOperations({
      queueSize: 1000,
      operations: ['add', 'reorder', 'remove'],
      iterations: 100
    });

    expect(queueResults.averageOperationTime).toBeLessThan(50); // 50ms per operation
    expect(queueResults.memoryUsage).toBeLessThan(50 * 1024 * 1024); // 50MB limit
  });
}); 