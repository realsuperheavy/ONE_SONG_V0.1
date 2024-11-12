import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RateLimitService } from '../rate-limit';
import { adminDb } from '../../admin';
import * as admin from 'firebase-admin';

vi.mock('../../admin');
vi.mock('firebase-admin');

describe('RateLimitService', () => {
  let service: RateLimitService;
  const mockTimestamp = {
    seconds: Math.floor(Date.now() / 1000),
    nanoseconds: 0,
    toDate: () => new Date(),
    toMillis: () => Date.now()
  };

  beforeEach(() => {
    service = new RateLimitService();
    vi.useFakeTimers();
    
    // Mock Timestamp.now() and Timestamp.fromMillis()
    vi.spyOn(admin.firestore.Timestamp, 'now').mockReturnValue(mockTimestamp);
    vi.spyOn(admin.firestore.Timestamp, 'fromMillis').mockReturnValue(mockTimestamp);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('checkRateLimit', () => {
    it('allows requests within limit', async () => {
      const mockTransaction = {
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({
            count: 5,
            window: {
              start: mockTimestamp,
              end: { ...mockTimestamp, seconds: mockTimestamp.seconds + 3600 }
            },
            limit: 10
          })
        }),
        update: vi.fn()
      };

      vi.mocked(adminDb.runTransaction).mockImplementation(async (fn) => {
        return fn(mockTransaction);
      });

      const result = await service.checkRateLimit('user-1', 'request');
      expect(result).toBe(true);
      expect(mockTransaction.update).toHaveBeenCalled();
    });

    it('blocks requests when limit exceeded', async () => {
      const mockTransaction = {
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({
            count: 10,
            window: {
              start: mockTimestamp,
              end: { ...mockTimestamp, seconds: mockTimestamp.seconds + 3600 }
            },
            limit: 10
          })
        })
      });

      vi.mocked(adminDb.runTransaction).mockImplementation(async (fn) => {
        return fn(mockTransaction);
      });

      const result = await service.checkRateLimit('user-1', 'request');
      expect(result).toBe(false);
    });

    it('creates new rate limit when none exists', async () => {
      const mockTransaction = {
        get: vi.fn().mockResolvedValue({
          exists: false
        }),
        set: vi.fn()
      };

      vi.mocked(adminDb.runTransaction).mockImplementation(async (fn) => {
        return fn(mockTransaction);
      });

      const result = await service.checkRateLimit('user-1', 'request');
      expect(result).toBe(true);
      expect(mockTransaction.set).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          userId: 'user-1',
          resourceType: 'request',
          count: 1
        })
      );
    });
  });

  describe('getRateLimitStatus', () => {
    it('returns correct remaining requests', async () => {
      vi.mocked(adminDb.collection).mockReturnValue({
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            exists: true,
            data: () => ({
              count: 5,
              window: {
                start: mockTimestamp,
                end: { ...mockTimestamp, seconds: mockTimestamp.seconds + 3600 }
              },
              limit: 10
            })
          })
        })
      } as any);

      const status = await service.getRateLimitStatus('user-1', 'request');
      expect(status.remaining).toBe(5);
      expect(status.resetAt).toBeInstanceOf(Date);
    });

    it('returns full limit for non-existent rate limit', async () => {
      vi.mocked(adminDb.collection).mockReturnValue({
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            exists: false
          })
        })
      } as any);

      const status = await service.getRateLimitStatus('user-1', 'request');
      expect(status.remaining).toBe(10); // Default limit from config
      expect(status.resetAt).toBeInstanceOf(Date);
    });
  });
}); 