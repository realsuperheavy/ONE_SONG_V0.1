import { render, fireEvent } from '@/test/utils/test-utils';
import { RequestButton } from '../RequestButton';
import { useSpotify } from '@/lib/spotify/SpotifyContext';

vi.mock('@/lib/spotify/SpotifyContext');

describe('RequestButton', () => {
  const mockEventId = 'event1';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSpotify).mockReturnValue({
      isAuthenticated: true,
      isInitializing: false,
      connect: vi.fn(),
      disconnect: vi.fn()
    } as any);
  });

  it('should render connect button when not authenticated', () => {
    vi.mocked(useSpotify).mockReturnValue({
      isAuthenticated: false,
      isInitializing: false,
      connect: vi.fn(),
      disconnect: vi.fn()
    } as any);

    const { getByRole } = render(
      <RequestButton eventId={mockEventId} />
    );

    expect(getByRole('button')).toHaveTextContent(/connect/i);
  });

  it('should render request button when authenticated', () => {
    const { getByRole } = render(
      <RequestButton eventId={mockEventId} />
    );

    expect(getByRole('button')).toHaveTextContent(/request/i);
  });

  it('should open modal on click', () => {
    const { getByRole, getByText } = render(
      <RequestButton eventId={mockEventId} />
    );

    fireEvent.click(getByRole('button'));

    expect(getByText('Request a Song')).toBeInTheDocument();
  });

  it('should not render during initialization', () => {
    vi.mocked(useSpotify).mockReturnValue({
      isAuthenticated: false,
      isInitializing: true,
      connect: vi.fn(),
      disconnect: vi.fn()
    } as any);

    const { container } = render(
      <RequestButton eventId={mockEventId} />
    );

    expect(container.firstChild).toBeNull();
  });
}); 