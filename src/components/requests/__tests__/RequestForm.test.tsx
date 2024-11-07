import { render, fireEvent, waitFor } from '@/test/utils/test-utils';
import { RequestForm } from '../RequestForm';
import { requestService } from '@/lib/firebase/services/request';
import { useAuthStore } from '@/store/auth';

vi.mock('@/lib/firebase/services/request');
vi.mock('@/store/auth');

describe('RequestForm', () => {
  const mockUser = { id: 'user1' };
  const mockTrack = {
    id: 'track1',
    title: 'Test Track',
    artist: 'Test Artist',
    duration: 30000
  };
  const mockEventId = 'event1';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthStore).mockReturnValue({
      user: mockUser
    } as any);
    vi.mocked(requestService.createRequest).mockResolvedValue('request1');
  });

  it('should submit request with message', async () => {
    const onSuccess = vi.fn();
    const { getByPlaceholderText, getByRole } = render(
      <RequestForm
        eventId={mockEventId}
        song={mockTrack}
        onSuccess={onSuccess}
      />
    );

    const messageInput = getByPlaceholderText(/add a message/i);
    fireEvent.change(messageInput, { target: { value: 'Test message' } });

    const submitButton = getByRole('button', { name: /send request/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(requestService.createRequest).toHaveBeenCalledWith({
        eventId: mockEventId,
        userId: mockUser.id,
        song: mockTrack,
        metadata: {
          message: 'Test message',
          requestTime: expect.any(String),
          votes: 0
        }
      });
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('should handle submission errors', async () => {
    const error = new Error('Request failed');
    vi.mocked(requestService.createRequest).mockRejectedValue(error);

    const { getByRole, getByText } = render(
      <RequestForm
        eventId={mockEventId}
        song={mockTrack}
      />
    );

    const submitButton = getByRole('button', { name: /send request/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(getByText(error.message)).toBeInTheDocument();
    });
  });
}); 