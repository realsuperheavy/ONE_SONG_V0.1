import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RequestManager } from '../RequestManager';
import { EventRequestService } from '@/lib/firebase/services/event-request';
import { analyticsService } from '@/lib/firebase/services/analytics';

vi.mock('@/lib/firebase/services/event-request');
vi.mock('@/lib/firebase/services/analytics');

describe('RequestManager', () => {
  const mockRequests = [
    {
      id: '1',
      eventId: 'test-event',
      userId: 'test-user',
      song: {
        id: 'song-1',
        title: 'Test Song',
        artist: 'Test Artist',
        duration: 180000
      },
      metadata: {
        votes: 5,
        requestTime: Date.now()
      },
      status: 'pending'
    }
  ];

  beforeEach(() => {
    vi.mocked(EventRequestService.prototype.getEventRequests).mockResolvedValue(mockRequests);
    vi.mocked(EventRequestService.prototype.updateRequestStatus).mockResolvedValue();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('loads and displays requests', async () => {
    render(<RequestManager eventId="test-event" />);

    await waitFor(() => {
      expect(screen.getByText('Test Song')).toBeInTheDocument();
      expect(screen.getByText('Test Artist')).toBeInTheDocument();
      expect(screen.getByText('5 votes')).toBeInTheDocument();
    });
  });

  it('handles request approval', async () => {
    const onRequestUpdate = vi.fn();
    render(
      <RequestManager 
        eventId="test-event" 
        onRequestUpdate={onRequestUpdate}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Song')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Approve'));

    await waitFor(() => {
      expect(EventRequestService.prototype.updateRequestStatus)
        .toHaveBeenCalledWith('test-event', '1', 'approve');
      expect(onRequestUpdate).toHaveBeenCalledWith(mockRequests[0]);
    });
  });

  it('handles request rejection', async () => {
    render(<RequestManager eventId="test-event" />);

    await waitFor(() => {
      expect(screen.getByText('Test Song')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Reject'));

    await waitFor(() => {
      expect(EventRequestService.prototype.updateRequestStatus)
        .toHaveBeenCalledWith('test-event', '1', 'reject');
    });
  });

  it('handles cleanup on unmount', async () => {
    const { unmount } = render(<RequestManager eventId="test-event" />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Song')).toBeInTheDocument();
    });

    unmount();

    // Verify no memory leaks or state updates after unmount
    expect(EventRequestService.prototype.getEventRequests).toHaveBeenCalledTimes(1);
  });
}); 