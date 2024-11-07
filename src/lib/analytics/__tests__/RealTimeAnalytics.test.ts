import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RealTimeAnalytics } from '../RealTimeAnalytics';
import { CustomMetricsManager } from '../CustomMetricsManager';
import { AlertSystem } from '../AlertSystem';
import { Cache } from '@/lib/cache';
import { ref, onValue } from 'firebase/database';
import { analyticsService } from '@/lib/firebase/services/analytics';

// Mock dependencies
vi.mock('firebase/database');
vi.mock('@/lib/firebase/services/analytics');
vi.mock('@/lib/cache');

describe('RealTimeAnalytics', () => {
  let analytics: RealTimeAnalytics;
  let metricsManager: CustomMetricsManager;
  let alertSystem: AlertSystem;
  let mockUnsubscribe: vi.Mock;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup mocks
    mockUnsubscribe = vi.fn();
    vi.mocked(onValue).mockImplementation((ref, callback) => {
      callback({
        val: () => ({
          requests: [
            { timestamp: Date.now() - 30000 }, // 30 seconds ago
            { timestamp: Date.now() - 45000 }  // 45 seconds ago
          ],
          errors: [
            { timestamp: Date.now() - 120000 }, // 2 minutes ago
            { timestamp: Date.now() - 180000 }  // 3 minutes ago
          ],
          responseTimes: [100, 150, 200]
        })
      });
      return mockUnsubscribe;
    });

    // Initialize dependencies
    metricsManager = new CustomMetricsManager({
      updateInterval: 1000,
      maxBatchSize: 100
    });
    alertSystem = new AlertSystem({
      checkInterval: 1000
    });

    // Initialize RealTimeAnalytics
    analytics = new RealTimeAnalytics({
      metricsManager,
      alertSystem,
      updateInterval: 1000
    });
  });

  afterEach(() => {
    analytics.cleanup();
  });

  it('tracks event metrics correctly', async () => {
    const eventId = 'test-event-1';
    await analytics.trackEventMetrics(eventId);

    // Verify Firebase subscription
    expect(ref).toHaveBeenCalledWith(expect.any(Object), `events/${eventId}/metrics`);
    expect(onValue).toHaveBeenCalled();

    // Verify metrics tracking
    expect(metricsManager.trackMetric).toHaveBeenCalledWith(
      'requestRate',
      expect.any(Number)
    );
  });

  it('handles empty metrics data gracefully', async () => {
    vi.mocked(onValue).mockImplementationOnce((ref, callback) => {
      callback({ val: () => null });
      return mockUnsubscribe;
    });

    await analytics.trackEventMetrics('test-event-2');
    expect(metricsManager.trackMetric).not.toHaveBeenCalled();
  });

  it('calculates request rate correctly', async () => {
    const eventId = 'test-event-3';
    await analytics.trackEventMetrics(eventId);

    // Should be 2 requests in last minute = 2/60 = 0.033 requests per second
    const expectedRate = 2 / 60;
    expect(metricsManager.trackMetric).toHaveBeenCalledWith(
      'requestRate',
      expectedRate
    );
  });

  it('triggers alerts for high error rates', async () => {
    vi.mocked(onValue).mockImplementationOnce((ref, callback) => {
      callback({
        val: () => ({
          errors: Array(11).fill({ timestamp: Date.now() - 60000 }) // 11 errors in last minute
        })
      });
      return mockUnsubscribe;
    });

    await analytics.trackEventMetrics('test-event-4');
    expect(alertSystem.addRule).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'error'
      })
    );
  });

  it('uses cache effectively', async () => {
    const eventId = 'test-event-5';
    const mockCache = new Cache({ maxSize: 1000, ttl: 5000 });
    
    // First call should process metrics
    await analytics.trackEventMetrics(eventId);
    expect(metricsManager.trackMetric).toHaveBeenCalled();

    // Second call within cache period should not process metrics
    vi.mocked(metricsManager.trackMetric).mockClear();
    await analytics.trackEventMetrics(eventId);
    expect(metricsManager.trackMetric).not.toHaveBeenCalled();
  });

  it('cleans up listeners on stopTracking', async () => {
    const eventId = 'test-event-6';
    await analytics.trackEventMetrics(eventId);
    await analytics.stopTracking(eventId);

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('handles analytics service errors gracefully', async () => {
    const error = new Error('Analytics error');
    vi.mocked(analyticsService.trackEvent).mockRejectedValueOnce(error);

    await analytics.trackEventMetrics('test-event-7');
    expect(analyticsService.trackError).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        context: 'real_time_analytics'
      })
    );
  });

  it('maintains periodic updates', async () => {
    vi.useFakeTimers();
    const eventId = 'test-event-8';
    await analytics.trackEventMetrics(eventId);

    // Fast-forward time
    vi.advanceTimersByTime(1000);
    expect(metricsManager.trackMetric).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it('performs complete cleanup', () => {
    const eventId = 'test-event-9';
    analytics.trackEventMetrics(eventId);
    analytics.cleanup();

    expect(mockUnsubscribe).toHaveBeenCalled();
    // Verify cache is cleared
    expect(Cache.prototype.clear).toHaveBeenCalled();
  });
}); 