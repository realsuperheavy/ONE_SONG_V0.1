import { useState, useCallback } from 'react';
import { useAuthStore } from '@/store/auth';
import { spotifyService } from '@/lib/spotify/services';

export interface SpotifyTrack {
  id: string;
  title: string;
  artist: string;
  albumArt?: string;
  duration: number;
  previewUrl?: string;
  popularity: number;
  explicit: boolean;
}

interface UseSpotifySearchOptions {
  limit?: number;
  debounceMs?: number;
}

export function useSpotifySearch(options: UseSpotifySearchOptions = {}) {
  const { limit = 20, debounceMs = 300 } = options;
  const [results, setResults] = useState<SpotifyTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const user = useAuthStore((state) => state.user);

  let debounceTimeout: NodeJS.Timeout;

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    // Clear previous timeout
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    // Set new timeout
    debounceTimeout = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const searchResults = await spotifyService.searchTracks(query, {
          limit,
          market: 'US' // TODO: Make this configurable
        });

        // Transform Spotify track data to our format
        const tracks: SpotifyTrack[] = searchResults.tracks.items.map(track => ({
          id: track.id,
          title: track.name,
          artist: track.artists.map(a => a.name).join(', '),
          albumArt: track.album.images[0]?.url,
          duration: track.duration_ms,
          previewUrl: track.preview_url || undefined,
          popularity: track.popularity,
          explicit: track.explicit
        }));

        setResults(tracks);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, debounceMs);
  }, [limit, debounceMs]);

  return {
    results,
    loading,
    error,
    search
  };
} 