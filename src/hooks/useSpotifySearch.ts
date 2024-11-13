import { useState, useCallback } from 'react';
import { spotifyService } from '@/lib/spotify/services/spotify';
import type { SpotifyTrack } from '@/types/models';
import type { SpotifyApiTrack } from '@/types/spotify';
import { useDebounce } from '@/hooks/useDebounce';
import { analyticsService } from '@/lib/firebase/services/analytics';

export function useSpotifySearch() {
  const [results, setResults] = useState<SpotifyApiTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const tracks = await spotifyService.searchTracks(query);
      setResults(tracks);
      
      analyticsService.trackEvent('spotify_search_completed', {
        query,
        resultCount: tracks.length
      });
    } catch (error) {
      setError(error as Error);
      analyticsService.trackError(error as Error, {
        context: 'spotify_search_hook',
        query
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedSearch = useDebounce(search, 300);

  return {
    results,
    loading,
    error,
    search: debouncedSearch
  };
} 