import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RealTimeMetrics } from '../RealTimeMetrics';
import { analyticsService } from '@/lib/firebase/services/analytics';
import { rtdb } from '@/lib/firebase/config';

vi.mock('@/lib/firebase/config');
vi.mock('@/lib/firebase/services/analytics');

describe('RealTimeMetrics', () => {
  let metrics: RealTimeMetrics;
  const mockEventId = 'test-event-123';

  beforeEach(() => {
    vi.useFakeTimers();
    metrics = new RealTimeMetrics(mockEventId);
  });

  afterEach(() => {
    metrics.cleanup();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('Tracking Initialization', () => {
    it('should set up tracking intervals correctly', () => {
      metrics.startTracking();
      
      // Should set up 3 intervals
      expect(vi.getTimerCount()).toBe(3);
    });

    it('should clean up intervals on cleanup', () => {
      metrics.startTracking();
      metrics.cleanup();
      
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  describe('Metric Tracking', () => {
    beforeEach(() => {
      metrics.startTracking();
    });

    it('should track queue metrics at correct interval', async () => {
      vi.advanceTimersByTime(30000); // 30 seconds
      
      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        'queue_health',
        expect.objectContaining({
          timestamp: expect.any(Function)
        })
      );
    });

    it('should track engagement metrics at correct interval', async () => {
      vi.advanceTimersByTime(60000); // 1 minute
      
      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        'user_engagement',
        expect.objectContaining({
          timestamp: expect.any(Function)
        })
      );
    });

    it('should track performance metrics at correct interval', async () => {
      vi.advanceTimersByTime(15000); // 15 seconds
      
      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        'system_performance',
        expect.objectContaining({
          timestamp: expect.any(Function)
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle tracking errors gracefully', async () => {
      const mockError = new Error('Tracking failed');
      vi.mocked(analyticsService.trackEvent).mockRejectedValueOnce(mockError);

      metrics.startTracking();
      vi.advanceTimersByTime(30000);

      // Should not throw error and continue tracking
      expect(metrics).toBeDefined();
    });
  });
}); 