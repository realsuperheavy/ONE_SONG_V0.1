import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import QueueViewPage from '../page';
import { useQueueStore } from '@/store/queue';
import { useEventStore } from '@/store/event';
import { useQueueManager } from '@/hooks/useQueueManager';
import { analyticsService } from '@/lib/firebase/services/analytics';

jest.mock('@/store/queue');
jest.mock('@/store/event');
jest.mock('@/hooks/useQueueManager');
jest.mock('@/lib/firebase/services/analytics');
jest.mock('next/navigation', () => ({
  useParams: () => ({ eventId: 'test-123' })
}));

describe('QueueViewPage', () => {
  const mockQueue = [
    {
      id: 'queue-1',
      song: { title: 'Test Song 1', artist: 'Artist 1' },
      status: 'pending',
      queuePosition: 1,
      addedAt: Date.now().toString()
    },
    {
      id: 'queue-2',
      song: { title: 'Test Song 2', artist: 'Artist 2' },
      status: 'pending',
      queuePosition: 2,
      addedAt: Date.now().toString()
    }
  ];

  const mockEvent = {
    id: 'test-123',
    name: 'Test Event'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useQueueStore as jest.Mock).mockReturnValue({
      queue: mockQueue,
      loading: false,
      error: null
    });
    (useEventStore as jest.Mock).mockReturnValue({
      currentEvent: mockEvent
    });
    (useQueueManager as jest.Mock).mockReturnValue({
      addToQueue: jest.fn()
    });
  });

  it('renders queue items correctly', () => {
    render(<QueueViewPage />);
    
    expect(screen.getByText('Test Song 1')).toBeInTheDocument();
    expect(screen.getByText('Test Song 2')).toBeInTheDocument();
    expect(screen.getByText('Test Event Queue')).toBeInTheDocument();
  });

  it('handles song request', async () => {
    const addToQueue = jest.fn().mockResolvedValue('new-request-id');
    (useQueueManager as jest.Mock).mockReturnValue({ addToQueue });

    render(<QueueViewPage />);

    const requestButton = screen.getByText('Request Song');
    await fireEvent.click(requestButton);

    expect(analyticsService.trackEvent).toHaveBeenCalledWith(
      'request_modal_opened',
      expect.objectContaining({
        eventId: 'test-123',
        queueLength: mockQueue.length
      })
    );
  });

  it('shows loading state', () => {
    (useQueueStore as jest.Mock).mockReturnValue({
      queue: [],
      loading: true,
      error: null
    });

    render(<QueueViewPage />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('shows error state', () => {
    (useQueueStore as jest.Mock).mockReturnValue({
      queue: [],
      loading: false,
      error: 'Failed to load queue'
    });

    render(<QueueViewPage />);
    expect(screen.getByText('Failed to load queue')).toBeInTheDocument();
  });

  it('tracks page view analytics', () => {
    render(<QueueViewPage />);

    expect(analyticsService.trackEvent).toHaveBeenCalledWith(
      'page_view',
      expect.objectContaining({
        page: 'queue',
        eventId: 'test-123',
        eventName: 'Test Event'
      })
    );
  });
}); 