import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventFlowService } from '../event-flow';
import { RateLimitService } from '../rate-limit';
import { adminDb } from '../../admin';
import { analyticsService } from '../analytics';
import { AppError } from '@/lib/error/AppError';
import { Timestamp } from 'firebase-admin/firestore';

vi.mock('../../admin');
vi.mock('../analytics');
vi.mock('../rate-limit');

describe('EventFlowService', () => {
  let service: EventFlowService;
  const mockEvent = {
    id: 'event-1',
    status: 'active',
    settings: {
      requireApproval: true
    },
    stats: {
      requestCount: 0
    }
  };

  beforeEach(() => {
    service = new EventFlowService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createEventRequest', () => {
    it('handles rate limiting correctly', async () => {
      vi.mocked(RateLimitService.prototype.checkRateLimit).mockResolvedValue(false);

      await expect(
        service.createEventRequest('event-1', 'user-1', {
          song: { id: 'song-1', title: 'Test Song', artist: 'Test Artist', duration: 180000 }
        })
      ).rejects.toThrow(AppError);

      expect(RateLimitService.prototype.checkRateLimit)
        .toHaveBeenCalledWith('user-1', 'request');
    });

    it('creates request with correct status based on event settings', async () => {
      vi.mocked(RateLimitService.prototype.checkRateLimit).mockResolvedValue(true);
      
      const mockTransaction = {
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => mockEvent
        }),
        set: vi.fn(),
        update: vi.fn()
      };

      vi.mocked(adminDb.runTransaction).mockImplementation(async (fn) => {
        await fn(mockTransaction);
      });

      await service.createEventRequest('event-1', 'user-1', {
        song: { id: 'song-1', title: 'Test Song', artist: 'Test Artist', duration: 180000 }
      });

      expect(mockTransaction.set).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          status: 'pending', // Because mockEvent.settings.requireApproval is true
          song: expect.objectContaining({ id: 'song-1' })
        })
      );
    });

    it('updates event stats correctly', async () => {
      vi.mocked(RateLimitService.prototype.checkRateLimit).mockResolvedValue(true);
      
      const mockTransaction = {
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => mockEvent
        }),
        set: vi.fn(),
        update: vi.fn()
      };

      vi.mocked(adminDb.runTransaction).mockImplementation(async (fn) => {
        await fn(mockTransaction);
      });

      await service.createEventRequest('event-1', 'user-1', {
        song: { id: 'song-1', title: 'Test Song', artist: 'Test Artist', duration: 180000 }
      });

      expect(mockTransaction.update).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          'stats.requestCount': 1
        })
      );
    });

    it('tracks analytics for request creation', async () => {
      vi.mocked(RateLimitService.prototype.checkRateLimit).mockResolvedValue(true);
      
      const mockTransaction = {
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => mockEvent
        }),
        set: vi.fn(),
        update: vi.fn()
      };

      vi.mocked(adminDb.runTransaction).mockImplementation(async (fn) => {
        await fn(mockTransaction);
      });

      await service.createEventRequest('event-1', 'user-1', {
        song: { id: 'song-1', title: 'Test Song', artist: 'Test Artist', duration: 180000 }
      });

      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        'request_created',
        expect.any(Object)
      );
    });
  });

  describe('getEventRequests', () => {
    it('applies filters correctly', async () => {
      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue({
          docs: [{
            id: 'request-1',
            data: () => ({
              song: { id: 'song-1' },
              status: 'pending'
            })
          }]
        })
      };

      vi.mocked(adminDb.collection).mockReturnValue(mockQuery as any);

      await service.getEventRequests('event-1', {
        status: 'pending',
        orderBy: 'votes',
        limit: 10
      });

      expect(mockQuery.where).toHaveBeenCalledWith('status', '==', 'pending');
      expect(mockQuery.orderBy).toHaveBeenCalledWith('metadata.votes', 'desc');
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
    });
  });
}); 