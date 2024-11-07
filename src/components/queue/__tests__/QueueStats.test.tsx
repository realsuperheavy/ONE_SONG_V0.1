import { render } from '@/test/utils/test-utils';
import { QueueStats } from '../QueueStats';
import { useQueue } from '@/hooks/useQueue';

vi.mock('@/hooks/useQueue');

describe('QueueStats', () => {
  const mockEventId = 'event1';
  const mockQueue = [
    { id: '1', queuePosition: 0 },
    { id: '2', queuePosition: 1 },
    { id: '3', queuePosition: 2 }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useQueue).mockReturnValue({
      queue: mockQueue,
      loading: false,
      error: null
    });
  });

  it('should render queue statistics', () => {
    const { getByText } = render(
      <QueueStats eventId={mockEventId} />
    );

    expect(getByText('3')).toBeInTheDocument(); // Total songs
    expect(getByText(/in queue/i)).toBeInTheDocument();
  });

  it('should handle loading state', () => {
    vi.mocked(useQueue).mockReturnValue({
      queue: [],
      loading: true,
      error: null
    });

    const { getByRole } = render(
      <QueueStats eventId={mockEventId} />
    );

    expect(getByRole('progressbar')).toBeInTheDocument();
  });

  it('should handle error state', () => {
    const error = 'Failed to load queue';
    vi.mocked(useQueue).mockReturnValue({
      queue: [],
      loading: false,
      error
    });

    const { getByText } = render(
      <QueueStats eventId={mockEventId} />
    );

    expect(getByText(error)).toBeInTheDocument();
  });

  it('should show empty queue message', () => {
    vi.mocked(useQueue).mockReturnValue({
      queue: [],
      loading: false,
      error: null
    });

    const { getByText } = render(
      <QueueStats eventId={mockEventId} />
    );

    expect(getByText('0')).toBeInTheDocument();
    expect(getByText(/queue is empty/i)).toBeInTheDocument();
  });
}); 