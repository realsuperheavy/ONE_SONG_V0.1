import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AttendeeManagementService } from '../attendee';
import { adminDb } from '../../admin';
import { analyticsService } from '../analytics';
import { AppError } from '@/lib/error/AppError';
import { Timestamp } from 'firebase-admin/firestore';

vi.mock('../../admin');
vi.mock('../analytics');

describe('AttendeeManagementService', () => {
  let service: AttendeeManagementService;

  beforeEach(() => {
    service = new AttendeeManagementService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('joinEvent', () => {
    it('successfully joins event', async () => {
      const mockTransaction = {
        get: vi.fn().mockImplementation((ref) => ({
          exists: true,
          data: () => ({
            status: 'active',
            stats: { attendeeCount: 0 }
          })
        })),
        set: vi.fn(),
        update: vi.fn()
      };

      vi.mocked(adminDb.runTransaction).mockImplementation(async (fn) => {
        await fn(mockTransaction);
      });

      await service.joinEvent('event-1', 'user-1');

      expect(mockTransaction.set).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          userId: 'user-1',
          eventId: 'event-1',
          status: 'active'
        }),
        expect.any(Object)
      );

      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        'attendee_joined',
        expect.any(Object)
      );
    });

    it('throws error for inactive event', async () => {
      const mockTransaction = {
        get: vi.fn().mockImplementation((ref) => ({
          exists: true,
          data: () => ({
            status: 'ended',
            stats: { attendeeCount: 0 }
          })
        }))
      };

      vi.mocked(adminDb.runTransaction).mockImplementation(async (fn) => {
        await fn(mockTransaction);
      });

      await expect(service.joinEvent('event-1', 'user-1'))
        .rejects.toThrow(AppError);
    });
  });

  describe('getEventAttendees', () => {
    it('applies filters correctly', async () => {
      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue({
          docs: [{
            data: () => ({
              userId: 'user-1',
              status: 'active',
              joinedAt: Timestamp.now()
            })
          }]
        })
      };

      vi.mocked(adminDb.collection).mockReturnValue({
        doc: vi.fn().mockReturnValue({
          collection: vi.fn().mockReturnValue(mockQuery)
        })
      } as any);

      await service.getEventAttendees('event-1', {
        status: 'active',
        orderBy: 'joinedAt',
        limit: 10
      });

      expect(mockQuery.where).toHaveBeenCalledWith('status', '==', 'active');
      expect(mockQuery.orderBy).toHaveBeenCalledWith('joinedAt', 'desc');
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
    });
  });

  describe('updateAttendeeStatus', () => {
    it('successfully updates status', async () => {
      const mockRef = {
        update: vi.fn().mockResolvedValue(undefined)
      };

      vi.mocked(adminDb.collection).mockReturnValue({
        doc: vi.fn().mockReturnValue({
          collection: vi.fn().mockReturnValue({
            doc: vi.fn().mockReturnValue(mockRef)
          })
        })
      } as any);

      await service.updateAttendeeStatus('event-1', 'user-1', 'inactive');

      expect(mockRef.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'inactive',
          lastActiveAt: expect.any(Timestamp)
        })
      );
    });
  });
}); 