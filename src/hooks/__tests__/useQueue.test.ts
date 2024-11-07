import { renderHook, act } from '@testing-library/react';
import { useQueue } from '../useQueue';
import { queueService } from '@/lib/firebase/services/queue';

vi.mock('@/lib/firebase/services/queue');

describe('useQueue', () => {
  const mockEventId = 'event1';
  const mockQueue = [
    { id: '1', queuePosition: 0 },
    { id: '2', queuePosition: 1 }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(queueService.subscribeToQueue).mockImplementation((_, callback) => {
      callback(mockQueue);
      return () => {};
    });
  });

  it('should subscribe to queue updates', () => {
    const { result } = renderHook(() => useQueue(mockEventId));

    expect(queueService.subscribeToQueue).toHaveBeenCalledWith(
      mockEventId,
      expect.any(Function)
    );
    expect(result.current.queue).toEqual(mockQueue);
  });

  it('should handle loading state', () => {
    const { result } = renderHook(() => useQueue(mockEventId));
    expect(result.current.loading).toBe(false);
  });

  it('should handle errors', async () => {
    const error = new Error('Queue error');
    vi.mocked(queueService.subscribeToQueue).mockImplementation(() => {
      throw error;
    });

    const { result } = renderHook(() => useQueue(mockEventId));
    expect(result.current.error).toBe(error.message);
  });
}); 