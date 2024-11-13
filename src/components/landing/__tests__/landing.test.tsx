import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { Landing } from '../landing';
import { useRouter } from 'next/navigation';
import { eventService } from '@/lib/firebase/services/event';
import { analyticsService } from '@/lib/firebase/services/analytics';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

jest.mock('@/lib/firebase/services/event');
jest.mock('@/lib/firebase/services/analytics');

describe('Landing', () => {
  const mockRouter = {
    push: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('renders join event form', () => {
    render(<Landing />);
    expect(screen.getByText('Join an Event')).toBeInTheDocument();
    expect(screen.getByPlaceholder('Enter event code')).toBeInTheDocument();
  });

  it('handles successful event join', async () => {
    const mockEvent = {
      id: 'test-123',
      name: 'Test Event'
    };

    (eventService.getEventByCode as jest.Mock).mockResolvedValue(mockEvent);

    render(<Landing />);

    const input = screen.getByPlaceholder('Enter event code');
    const joinButton = screen.getByRole('button', { name: /Join/i });

    await fireEvent.change(input, { target: { value: 'TEST123' } });
    await fireEvent.click(joinButton);

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith(`/events/${mockEvent.id}/queue`);
      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        'event_join_attempt',
        expect.objectContaining({
          method: 'code',
          eventId: mockEvent.id,
          success: true
        })
      );
    });
  });

  it('handles event join error', async () => {
    (eventService.getEventByCode as jest.Mock).mockRejectedValue(new Error('Invalid code'));

    render(<Landing />);

    const input = screen.getByPlaceholder('Enter event code');
    const joinButton = screen.getByRole('button', { name: /Join/i });

    await fireEvent.change(input, { target: { value: 'INVALID' } });
    await fireEvent.click(joinButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid event code')).toBeInTheDocument();
      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        'event_join_attempt',
        expect.objectContaining({
          method: 'code',
          code: 'INVALID',
          success: false
        })
      );
    });
  });

  it('toggles nearby events visibility', async () => {
    render(<Landing />);

    const toggleButton = screen.getByRole('button', { name: /Show Nearby Events/i });
    await fireEvent.click(toggleButton);

    expect(screen.getByText('Hide Nearby Events')).toBeInTheDocument();
    expect(analyticsService.trackEvent).toHaveBeenCalledWith(
      'nearby_events_toggled',
      expect.objectContaining({
        action: 'show'
      })
    );
  });
}); 