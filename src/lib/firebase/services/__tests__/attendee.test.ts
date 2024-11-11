import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AttendeeManagementService } from '../attendee';
import { adminDb } from '../../admin';
import { analyticsService } from '../analytics';

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
          status: 'active'
        }),
        expect.any(Object)
      );
    });
  });
}); 