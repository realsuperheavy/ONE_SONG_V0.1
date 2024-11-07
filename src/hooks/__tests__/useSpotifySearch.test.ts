import { renderHook, act } from '@testing-library/react';
import { useSpotifySearch } from '../useSpotifySearch';
import { spotifyService } from '@/lib/spotify/services';

vi.mock('@/lib/spotify/services');

describe('useSpotifySearch', () => {
  const mockResults = [
    { id: '1', name: 'Track 1' },
    { id: '2', name: 'Track 2' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(spotifyService.searchTracks).mockResolvedValue(mockResults);
  });

  it('should perform search and update results', async () => {
    const { result } = renderHook(() => useSpotifySearch());

    await act(async () => {
      await result.current.search('test query');
    });

    expect(spotifyService.searchTracks).toHaveBeenCalledWith('test query');
    expect(result.current.results).toEqual(mockResults);
    expect(result.current.loading).toBe(false);
  });

  it('should handle search errors', async () => {
    const error = new Error('Search failed');
    vi.mocked(spotifyService.searchTracks).mockRejectedValue(error);

    const { result } = renderHook(() => useSpotifySearch());

    await act(async () => {
      await result.current.search('test query');
    });

    expect(result.current.error).toBe(error.message);
    expect(result.current.loading).toBe(false);
  });
}); 