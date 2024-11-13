import { render, fireEvent, screen } from '@testing-library/react';
import { TrackManagement } from '../TrackManagement';
import { analyticsService } from '@/lib/firebase/services/analytics';

jest.mock('@/lib/firebase/services/analytics');

describe('TrackManagement', () => {
  const mockTrack = {
    id: 'test-track-123',
    name: 'Test Track',
    artists: [{ name: 'Test Artist' }],
    album: {
      images: [{ url: 'test-image-url' }]
    },
    preview_url: 'test-preview-url'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders track information correctly', () => {
    render(<TrackManagement track={mockTrack} />);
    
    expect(screen.getByText('Test Track')).toBeInTheDocument();
    expect(screen.getByText('Test Artist')).toBeInTheDocument();
  });

  it('tracks preview start event', () => {
    render(<TrackManagement track={mockTrack} />);
    
    const playButton = screen.getByLabelText('Play');
    fireEvent.click(playButton);

    expect(analyticsService.trackEvent).toHaveBeenCalledWith(
      'track_preview_started',
      expect.objectContaining({
        trackId: mockTrack.id,
        trackName: mockTrack.name
      })
    );
  });

  it('shows no preview message when preview_url is null', () => {
    const trackWithoutPreview = {
      ...mockTrack,
      preview_url: null
    };

    render(<TrackManagement track={trackWithoutPreview} />);
    
    expect(screen.getByText('No preview available')).toBeInTheDocument();
  });
}); 