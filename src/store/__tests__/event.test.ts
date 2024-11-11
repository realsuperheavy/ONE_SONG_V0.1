import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEventStore } from '../event';
import { adminDb } from '@/lib/firebase/admin';
import { analyticsService } from '@/lib/firebase/services/analytics';
import type { Event, QueueItem } from '@/types/events';

vi.mock('@/lib/firebase/admin');
vi.mock('@/lib/firebase/services/analytics');

describe('EventStore', () => {
  const mockEvent: Event = {
    id: 'event-1',
    djId: 'dj-1',
    status: 'active',
    details: {
      name: 'Test Event'
    },
    settings: {
      allowTips: true,
      requireApproval: true,
      maxQueueSize: 50,
      blacklistedGenres: []
    },
    stats: {
      attendeeCount: 0,
      requestCount: 0,
      totalTips: 0
    },
    metadata: {
      createdAt: { seconds: 0, nanoseconds: 0 },
      updatedAt: { seconds: 0, nanoseconds: 0 }
    }
  };

  beforeEach(() => {
    vi.mocked(adminDb.collection).mockReturnValue({
      doc: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: true,
          id: 'event-1',
          data: () => mockEvent
        }),
        update: vi.fn().mockResolvedValue(undefined)
      })
    } as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('loads event successfully', async () => {
    const { result } = renderHook(() => useEventStore());

    await act(async () => {
      await result.current.loadEvent('event-1');
    });

    expect(result.current.currentEvent).toEqual(mockEvent);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles event load failure', async () => {
    vi.mocked(adminDb.collection).mockReturnValue({
      doc: vi.fn().mockReturnValue({
        get: vi.fn().mockRejectedValue(new Error('Failed to load'))
      })
    } as any);

    const { result } = renderHook(() => useEventStore());

    await act(async () => {
      try {
        await result.current.loadEvent('event-1');
      } catch (error) {
        // Expected error
      }
    });

    expect(result.current.currentEvent).toBeNull();
    expect(result.current.error).toBe('Failed to load event');
    expect(analyticsService.trackError).toHaveBeenCalled();
  });

  it('updates event status', async () => {
    const { result } = renderHook(() => useEventStore());

    await act(async () => {
      result.current.setCurrentEvent(mockEvent);
      await result.current.updateEventStatus('event-1', 'ended');
    });

    expect(result.current.currentEvent?.status).toBe('ended');
    expect(analyticsService.trackEvent).toHaveBeenCalledWith(
      'event_status_updated',
      expect.any(Object)
    );
  });
}); 