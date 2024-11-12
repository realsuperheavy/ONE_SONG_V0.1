import { useState, useCallback, useRef, useEffect } from 'react';
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

export function useSpotifySearch() {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const [results, setResults] = useState<SpotifyTrack[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (query: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    timeoutRef.current = setTimeout(async () => {
      try {
        const tracks = await spotifyService.searchTracks(query);
        setResults(tracks);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { search, results, loading };
} 