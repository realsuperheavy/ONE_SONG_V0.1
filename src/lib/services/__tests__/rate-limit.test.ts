import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RateLimitService } from '../rate-limit';
import { adminDb } from '../../firebase/admin';
import { analyticsService } from '../../firebase/services/analytics';

vi.mock('../../firebase/admin');
vi.mock('../../firebase/services/analytics');

describe('RateLimitService', () => {
  let service: RateLimitService;
  const testConfig = {
    request: {
      limit: 2,
      windowSeconds: 60
    },
    search: {
      limit: 2,
      windowSeconds: 60
    },
    attendee: {
      limit: 2,
      windowSeconds: 60
    }
  };

  beforeEach(() => {
    service = new RateLimitService(adminDb, testConfig);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('checkRateLimit', () => {
    it('allows first request', async () => {
      const mockTransaction = {
        get: vi.fn().mockResolvedValue({ exists: false }),
        set: vi.fn()
      };

      vi.mocked(adminDb.runTransaction).mockImplementation(async (fn) => {
        return fn(mockTransaction);
      });

      const result = await service.checkRateLimit('user1', 'request');
      expect(result).toBe(true);
      expect(mockTransaction.set).toHaveBeenCalled();
    });

    it('blocks requests over limit', async () => {
      const mockTransaction = {
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({
            count: 2,
            window: {
              start: new Date(),
              end: new Date(Date.now() + 60000)
            }
          })
        })
      };

      vi.mocked(adminDb.runTransaction).mockImplementation(async (fn) => {
        return fn(mockTransaction);
      });

      const result = await service.checkRateLimit('user1', 'request');
      expect(result).toBe(false);
      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        'rate_limit_exceeded',
        expect.any(Object)
      );
    });

    it('resets counter after window expires', async () => {
      const mockTransaction = {
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({
            count: 2,
            window: {
              start: new Date(Date.now() - 70000), // Window expired
              end: new Date(Date.now() - 10000)
            }
          })
        }),
        set: vi.fn()
      };

      vi.mocked(adminDb.runTransaction).mockImplementation(async (fn) => {
        return fn(mockTransaction);
      });

      const result = await service.checkRateLimit('user1', 'request');
      expect(result).toBe(true);
      expect(mockTransaction.set).toHaveBeenCalled();
    });
  });

  // Add more test cases...
}); 