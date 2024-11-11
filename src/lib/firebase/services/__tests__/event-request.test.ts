import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventRequestService } from '../event-request';
import { adminDb } from '../../admin';
import { analyticsService } from '../analytics';

vi.mock('../../admin');
vi.mock('../analytics');

describe('EventRequestService', () => {
  let service: EventRequestService;

  beforeEach(() => {
    service = new EventRequestService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('linkRequestToEvent', () => {
    it('successfully links request to event', async () => {
      const mockTransaction = {
        get: vi.fn().mockImplementation((ref) => {
          if (ref.path.includes('events')) {
            return {
              exists: true,
              data: () => ({
                settings: { requireApproval: true },
                stats: { requestCount: 0 }
              })
            };
          }
          return {
            exists: true,
            data: () => ({ songId: 'test-song' })
          };
        }),
        update: vi.fn()
      };

      vi.mocked(adminDb.runTransaction).mockImplementation(async (fn) => {
        await fn(mockTransaction);
      });

      await service.linkRequestToEvent('event-1', 'request-1', 'user-1');

      expect(mockTransaction.update).toHaveBeenCalledTimes(2);
      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        'request_linked_to_event',
        expect.any(Object)
      );
    });
  });
}); 