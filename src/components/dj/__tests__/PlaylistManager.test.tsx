import { render, fireEvent, screen } from '@testing-library/react';
import { PlaylistManager } from '../PlaylistManager';
import { useEventStore } from '@/store/event';
import { useSpotify } from '@/lib/spotify/SpotifyContext';
import { analyticsService } from '@/lib/firebase/services/analytics';

jest.mock('@/store/event');
jest.mock('@/lib/spotify/SpotifyContext');
jest.mock('@/lib/firebase/services/analytics');

describe('PlaylistManager', () => {
  const mockEventId = 'test-event-123';
  const mockTrack = {
    id: 'track-123',
    name: 'Test Track',
    artists: [{ name: 'Test Artist' }],
    album: {
      images: [{ url: 'test-image.jpg' }]
    }
  };

  beforeEach(() => {
    (useEventStore as jest.Mock).mockReturnValue({
      currentEvent: {
        currentTrack: mockTrack
      }
    });
    (useSpotify as jest.Mock).mockReturnValue({
      initialized: true,
      error: null
    });
  });

  it('renders current track information', () => {
    render(<PlaylistManager eventId={mockEventId} />);
    
    expect(screen.getByText('Test Track')).toBeInTheDocument();
    expect(screen.getByText('Test Artist')).toBeInTheDocument();
  });

  it('tracks analytics when track is viewed', () => {
    render(<PlaylistManager eventId={mockEventId} />);
    
    expect(analyticsService.trackEvent).toHaveBeenCalledWith(
      'track_view',
      expect.objectContaining({
        eventId: mockEventId,
        trackId: mockTrack.id
      })
    );
  });

  it('handles null current track gracefully', () => {
    (useEventStore as jest.Mock).mockReturnValue({
      currentEvent: { currentTrack: null }
    });

    render(<PlaylistManager eventId={mockEventId} />);
    
    expect(screen.queryByText('Test Track')).not.toBeInTheDocument();
  });
}); 