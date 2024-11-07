import { renderHook, act } from '@testing-library/react';
import { useQueueDragDrop } from '../useQueueDragDrop';
import { queueService } from '@/lib/firebase/services/queue';

vi.mock('@/lib/firebase/services/queue');

describe('useQueueDragDrop', () => {
  const mockEventId = 'event1';
  const mockQueue = [
    { id: '1', queuePosition: 0 },
    { id: '2', queuePosition: 1 }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle item reordering', async () => {
    const { result } = renderHook(() => useQueueDragDrop(mockEventId));

    await act(async () => {
      await result.current.handleDragEnd({
        source: { index: 0 },
        destination: { index: 1 }
      });
    });

    expect(queueService.reorderQueue).toHaveBeenCalledWith(
      mockEventId,
      ['2', '1']
    );
  });

  it('should not reorder if destination is null', async () => {
    const { result } = renderHook(() => useQueueDragDrop(mockEventId));

    await act(async () => {
      await result.current.handleDragEnd({
        source: { index: 0 },
        destination: null
      });
    });

    expect(queueService.reorderQueue).not.toHaveBeenCalled();
  });
}); 