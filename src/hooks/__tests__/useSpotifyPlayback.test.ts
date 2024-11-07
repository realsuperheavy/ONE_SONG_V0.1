import { renderHook, act } from '@testing-library/react';
import { useSpotifyPlayback } from '../useSpotifyPlayback';

describe('useSpotifyPlayback', () => {
  let audio: HTMLAudioElement;

  beforeEach(() => {
    audio = new Audio();
    vi.spyOn(window, 'Audio').mockImplementation(() => audio);
    vi.spyOn(audio, 'play').mockImplementation(() => Promise.resolve());
    vi.spyOn(audio, 'pause').mockImplementation(() => {});
  });

  it('should handle track playback', async () => {
    const { result } = renderHook(() => useSpotifyPlayback());
    const mockTrack = { id: '1', previewUrl: 'http://example.com/preview.mp3' };

    await act(async () => {
      await result.current.play(mockTrack);
    });

    expect(result.current.isPlaying).toBe(true);
    expect(result.current.currentTrack).toBe(mockTrack);
  });

  it('should handle pause', () => {
    const { result } = renderHook(() => useSpotifyPlayback());

    act(() => {
      result.current.pause();
    });

    expect(result.current.isPlaying).toBe(false);
  });

  it('should handle playback errors', async () => {
    const error = new Error('Playback failed');
    vi.spyOn(audio, 'play').mockRejectedValue(error);
    const onError = vi.fn();

    const { result } = renderHook(() => useSpotifyPlayback({ onError }));
    const mockTrack = { id: '1', previewUrl: 'http://example.com/preview.mp3' };

    await act(async () => {
      await result.current.play(mockTrack);
    });

    expect(onError).toHaveBeenCalledWith(error);
  });
}); 