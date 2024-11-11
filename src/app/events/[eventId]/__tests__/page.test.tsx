import { render, screen, waitFor } from '@testing-library/react';
import EventPage from '../page';
import { useEventStore } from '@/store/event';
import { useAuthStore } from '@/store/auth';
import type { Event } from '@/types/events';

vi.mock('@/store/event');
vi.mock('@/store/auth');
vi.mock('@/components/events/EventStatusManager', () => ({
  EventStatusManager: () => <div data-testid="event-status-manager">Status Manager</div>
}));
vi.mock('@/components/events/QueueManager', () => ({
  QueueManager: () => <div data-testid="queue-manager">Queue Manager</div>
}));
vi.mock('@/components/events/RequestManager', () => ({
  RequestManager: () => <div data-testid="request-manager">Request Manager</div>
}));
vi.mock('@/components/events/AttendeeListLive', () => ({
  AttendeeListLive: () => <div data-testid="attendee-list">Attendee List</div>
}));

describe('EventPage', () => {
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
    vi.mocked(useEventStore).mockReturnValue({
      currentEvent: mockEvent,
      setCurrentEvent: vi.fn()
    } as any);
  });

  it('shows loading state when event is not loaded', () => {
    vi.mocked(useEventStore).mockReturnValue({
      currentEvent: null,
      setCurrentEvent: vi.fn()
    } as any);

    render(<EventPage params={{ eventId: 'event-1' }} />);
    expect(screen.getByText('Loading event...')).toBeInTheDocument();
  });

  it('shows DJ controls when user is event DJ', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      user: { id: 'dj-1', type: 'dj' }
    } as any);

    render(<EventPage params={{ eventId: 'event-1' }} />);

    expect(screen.getByTestId('event-status-manager')).toBeInTheDocument();
    expect(screen.getByTestId('request-manager')).toBeInTheDocument();
  });

  it('hides DJ controls for non-DJ users', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      user: { id: 'user-1', type: 'user' }
    } as any);

    render(<EventPage params={{ eventId: 'event-1' }} />);

    expect(screen.queryByTestId('event-status-manager')).not.toBeInTheDocument();
    expect(screen.queryByTestId('request-manager')).not.toBeInTheDocument();
  });

  it('shows queue and attendee list for all users', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      user: { id: 'user-1', type: 'user' }
    } as any);

    render(<EventPage params={{ eventId: 'event-1' }} />);

    expect(screen.getByTestId('queue-manager')).toBeInTheDocument();
    expect(screen.getByTestId('attendee-list')).toBeInTheDocument();
  });
}); 