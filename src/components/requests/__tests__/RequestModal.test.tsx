import { render, fireEvent } from '@/test/utils/test-utils';
import { RequestModal } from '../RequestModal';
import { useSpotifySearch } from '@/hooks/useSpotifySearch';

vi.mock('@/hooks/useSpotifySearch');

describe('RequestModal', () => {
  const mockEventId = 'event1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render modal when open', () => {
    const { getByRole, getByText } = render(
      <RequestModal
        eventId={mockEventId}
        isOpen={true}
        onClose={() => {}}
      />
    );

    expect(getByRole('dialog')).toBeInTheDocument();
    expect(getByText('Request a Song')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    const { queryByRole } = render(
      <RequestModal
        eventId={mockEventId}
        isOpen={false}
        onClose={() => {}}
      />
    );

    expect(queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should handle close button click', () => {
    const handleClose = vi.fn();
    const { getByRole } = render(
      <RequestModal
        eventId={mockEventId}
        isOpen={true}
        onClose={handleClose}
      />
    );

    const closeButton = getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(handleClose).toHaveBeenCalled();
  });

  it('should handle successful request', async () => {
    const handleSuccess = vi.fn();
    const handleClose = vi.fn();
    
    const { getByRole } = render(
      <RequestModal
        eventId={mockEventId}
        isOpen={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    );

    // Simulate successful request
    // This would need to be expanded based on your actual implementation
    // of how requests are submitted

    expect(handleSuccess).toHaveBeenCalled();
    expect(handleClose).toHaveBeenCalled();
  });
}); 