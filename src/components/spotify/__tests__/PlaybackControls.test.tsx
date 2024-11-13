import { render, fireEvent, screen, act } from '@testing-library/react';
import { PlaybackControls } from '../PlaybackControls';
import { analyticsService } from '@/lib/firebase/services/analytics';

jest.mock('@/lib/firebase/services/analytics');

describe('PlaybackControls', () => {
  const mockProps = {
    previewUrl: 'test-preview-url',
    songTitle: 'Test Song',
    onPlaybackStart: jest.fn(),
    onPlaybackEnd: jest.fn(),
    isAttendee: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Audio
    window.HTMLMediaElement.prototype.play = jest.fn();
    window.HTMLMediaElement.prototype.pause = jest.fn();
  });

  it('renders play/pause button correctly', () => {
    render(<PlaybackControls {...mockProps} />);
    expect(screen.getByLabelText('Play')).toBeInTheDocument();
  });

  it('handles play/pause toggle', async () => {
    render(<PlaybackControls {...mockProps} />);
    
    const playButton = screen.getByLabelText('Play');
    await fireEvent.click(playButton);
    
    expect(mockProps.onPlaybackStart).toHaveBeenCalled();
    expect(analyticsService.trackEvent).toHaveBeenCalledWith(
      'preview_started',
      expect.objectContaining({
        songTitle: 'Test Song',
        userType: 'attendee'
      })
    );

    const pauseButton = screen.getByLabelText('Pause');
    await fireEvent.click(pauseButton);
    
    expect(analyticsService.trackEvent).toHaveBeenCalledWith(
      'preview_paused',
      expect.objectContaining({
        songTitle: 'Test Song',
        userType: 'attendee'
      })
    );
  });

  it('handles mute toggle', async () => {
    render(<PlaybackControls {...mockProps} />);
    
    const muteButton = screen.getByLabelText('Mute');
    await fireEvent.click(muteButton);
    
    expect(analyticsService.trackEvent).toHaveBeenCalledWith(
      'preview_mute_toggled',
      expect.objectContaining({
        songTitle: 'Test Song',
        muted: true,
        userType: 'attendee'
      })
    );
  });

  it('handles playback errors', async () => {
    window.HTMLMediaElement.prototype.play = jest.fn().mockRejectedValue(new Error('Playback failed'));
    
    render(<PlaybackControls {...mockProps} />);
    
    const playButton = screen.getByLabelText('Play');
    await fireEvent.click(playButton);
    
    expect(analyticsService.trackError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        context: 'preview_playback',
        songTitle: 'Test Song'
      })
    );
  });

  it('shows no preview message when previewUrl is null', () => {
    render(<PlaybackControls {...mockProps} previewUrl={null} />);
    expect(screen.getByText('No preview available')).toBeInTheDocument();
  });
}); 