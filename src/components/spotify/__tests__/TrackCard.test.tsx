import { render, fireEvent } from '@/test/utils/test-utils';
import { TrackCard } from '../TrackCard';
import { useSpotifyPlayback } from '@/hooks/useSpotifyPlayback';

vi.mock('@/hooks/useSpotifyPlayback');

describe('TrackCard', () => {
  const mockTrack = {
    id: '1',
    title: 'Test Track',
    artist: 'Test Artist',
    albumArt: 'https://example.com/art.jpg',
    previewUrl: 'https://example.com/preview.mp3',
    duration: 30000
  };

  const mockPlayback = {
    isPlaying: false,
    currentTrack: null,
    play: vi.fn(),
    pause: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSpotifyPlayback).mockReturnValue(mockPlayback);
  });

  it('should render track information', () => {
    const { getByText, getByAltText } = render(
      <TrackCard track={mockTrack} onClick={() => {}} />
    );

    expect(getByText('Test Track')).toBeInTheDocument();
    expect(getByText('Test Artist')).toBeInTheDocument();
    expect(getByAltText('Test Track album art')).toHaveAttribute(
      'src',
      'https://example.com/art.jpg'
    );
  });

  it('should handle play/pause', () => {
    const { getByRole } = render(
      <TrackCard track={mockTrack} onClick={() => {}} />
    );

    const playButton = getByRole('button');
    fireEvent.click(playButton);

    expect(mockPlayback.play).toHaveBeenCalledWith(mockTrack);

    // Simulate playing state
    vi.mocked(useSpotifyPlayback).mockReturnValue({
      ...mockPlayback,
      isPlaying: true,
      currentTrack: mockTrack
    });

    fireEvent.click(playButton);
    expect(mockPlayback.pause).toHaveBeenCalled();
  });

  it('should handle track selection', () => {
    const handleClick = vi.fn();
    const { container } = render(
      <TrackCard track={mockTrack} onClick={handleClick} />
    );

    fireEvent.click(container.firstChild as Element);
    expect(handleClick).toHaveBeenCalled();
  });
}); 