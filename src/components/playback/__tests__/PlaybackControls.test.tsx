import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { PlaybackControls } from '../PlaybackControls';
import { AdvancedPlaybackController } from '@/lib/playback/AdvancedPlaybackController';
import { analyticsService } from '@/lib/firebase/services/analytics';
import { useEventData } from '@/hooks/useEventData';

// Mock dependencies
vi.mock('@/lib/playback/AdvancedPlaybackController');
vi.mock('@/lib/firebase/services/analytics');
vi.mock('@/hooks/useEventData');

describe('PlaybackControls', () => {
  const mockEventId = 'test-event-123';
  const mockOnError = vi.fn();
  const mockQueue = [
    {
      id: '1',
      song: {
        id: 'song1',
        title: 'Test Song 1',
        artist: 'Test Artist 1',
        duration: 180
      }
    },
    {
      id: '2',
      song: {
        id: 'song2',
        title: 'Test Song 2',
        artist: 'Test Artist 2',
        duration: 200
      }
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock useEventData
    vi.mocked(useEventData).mockReturnValue({
      queue: mockQueue,
      loading: false,
      error: null
    });

    // Mock playback controller methods
    vi.mocked(AdvancedPlaybackController.prototype.play).mockResolvedValue();
    vi.mocked(AdvancedPlaybackController.prototype.pause).mockResolvedValue();
    vi.mocked(AdvancedPlaybackController.prototype.getCurrentTime).mockReturnValue(0);
    vi.mocked(AdvancedPlaybackController.prototype.getDuration).mockReturnValue(180);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders playback controls with initial state', () => {
    render(<PlaybackControls eventId={mockEventId} onError={mockOnError} />);
    
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next track/i })).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: /playback progress/i })).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: /volume/i })).toBeInTheDocument();
  });

  it('displays current track information', async () => {
    render(<PlaybackControls eventId={mockEventId} onError={mockOnError} />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Song 1')).toBeInTheDocument();
      expect(screen.getByText('Test Artist 1')).toBeInTheDocument();
    });
  });

  it('handles play/pause toggle correctly', async () => {
    render(<PlaybackControls eventId={mockEventId} onError={mockOnError} />);
    
    const playButton = screen.getByRole('button', { name: /play/i });
    
    // Test play
    await act(async () => {
      fireEvent.click(playButton);
    });
    
    expect(AdvancedPlaybackController.prototype.play).toHaveBeenCalled();
    expect(analyticsService.trackEvent).toHaveBeenCalledWith(
      'playback_started',
      expect.any(Object)
    );

    // Test pause
    await act(async () => {
      fireEvent.click(playButton);
    });
    
    expect(AdvancedPlaybackController.prototype.pause).toHaveBeenCalled();
    expect(analyticsService.trackEvent).toHaveBeenCalledWith(
      'playback_paused',
      expect.any(Object)
    );
  });

  it('updates progress during playback', async () => {
    vi.useFakeTimers();
    
    render(<PlaybackControls eventId={mockEventId} onError={mockOnError} />);
    
    // Start playback
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /play/i }));
    });

    // Mock progress
    vi.mocked(AdvancedPlaybackController.prototype.getCurrentTime).mockReturnValue(90);
    
    // Advance timers
    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    const progressBar = screen.getByRole('slider', { name: /playback progress/i });
    expect(progressBar).toHaveValue('50'); // 90/180 * 100
  });

  it('handles track transitions correctly', async () => {
    render(<PlaybackControls eventId={mockEventId} onError={mockOnError} />);
    
    const nextButton = screen.getByRole('button', { name: /next track/i });
    
    await act(async () => {
      fireEvent.click(nextButton);
    });

    expect(AdvancedPlaybackController.prototype.prepareNextTrack).toHaveBeenCalled();
    expect(AdvancedPlaybackController.prototype.transitionToNext).toHaveBeenCalled();
    expect(analyticsService.trackEvent).toHaveBeenCalledWith(
      'track_skipped',
      expect.any(Object)
    );
  });

  it('handles volume changes', async () => {
    render(<PlaybackControls eventId={mockEventId} onError={mockOnError} />);
    
    const volumeSlider = screen.getByRole('slider', { name: /volume/i });
    
    await act(async () => {
      fireEvent.change(volumeSlider, { target: { value: '50' } });
    });

    expect(AdvancedPlaybackController.prototype.setVolume).toHaveBeenCalledWith(0.5);
    expect(analyticsService.trackEvent).toHaveBeenCalledWith(
      'volume_changed',
      expect.any(Object)
    );
  });

  it('handles seek operations', async () => {
    render(<PlaybackControls eventId={mockEventId} onError={mockOnError} />);
    
    const progressBar = screen.getByRole('slider', { name: /playback progress/i });
    
    await act(async () => {
      fireEvent.change(progressBar, { target: { value: '50' } });
    });

    expect(AdvancedPlaybackController.prototype.seek).toHaveBeenCalledWith(90); // 50% of 180s
    expect(analyticsService.trackEvent).toHaveBeenCalledWith(
      'playback_seeked',
      expect.any(Object)
    );
  });

  it('handles playback errors gracefully', async () => {
    const error = new Error('Playback failed');
    vi.mocked(AdvancedPlaybackController.prototype.play).mockRejectedValueOnce(error);
    
    render(<PlaybackControls eventId={mockEventId} onError={mockOnError} />);
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /play/i }));
    });

    expect(mockOnError).toHaveBeenCalledWith(error);
    expect(analyticsService.trackError).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        context: 'playback_controls',
        action: 'play_pause'
      })
    );
  });

  it('cleans up resources on unmount', () => {
    const { unmount } = render(
      <PlaybackControls eventId={mockEventId} onError={mockOnError} />
    );
    
    unmount();
    
    expect(AdvancedPlaybackController.prototype.cleanup).toHaveBeenCalled();
  });
}); 