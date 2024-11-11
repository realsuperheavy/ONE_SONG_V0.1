import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RateLimitService } from '../rate-limit';
import { adminDb } from '../../admin';
import { Timestamp } from 'firebase-admin/firestore';

vi.mock('../../admin');

describe('RateLimitService', () => {
  let service: RateLimitService;

  beforeEach(() => {
    service = new RateLimitService();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('checkSubscriptionLimit', () => {
    it('allows subscription within limits', async () => {
      const mockTransaction = {
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({
            count: 2,
            window: {
              start: Timestamp.now(),
              end: new Timestamp(Date.now() / 1000 + 3600, 0)
            },
            limit: 5
          })
        }),
        update: vi.fn()
      };

      vi.mocked(adminDb.runTransaction).mockImplementation(async (fn) => {
        return fn(mockTransaction);
      });

      const result = await service.checkSubscriptionLimit('user-1', 'event-1');
      expect(result).toBe(true);
    });

    it('blocks subscription when limit exceeded', async () => {
      const mockTransaction = {
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({
            count: 5,
            window: {
              start: Timestamp.now(),
              end: new Timestamp(Date.now() / 1000 + 3600, 0)
            },
            limit: 5
          })
        }),
        update: vi.fn()
      };

      vi.mocked(adminDb.runTransaction).mockImplementation(async (fn) => {
        return fn(mockTransaction);
      });

      const result = await service.checkSubscriptionLimit('user-1', 'event-1');
      expect(result).toBe(false);
    });
  });
}); 