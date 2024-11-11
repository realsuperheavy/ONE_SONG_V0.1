import { useState, useEffect } from "react";
import { spotifyService } from "@/lib/spotify/service";
import type { SpotifyTrack } from "@/types/models";

export function useSpotifySearch(query: string) {
  const [results, setResults] = useState<SpotifyTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!query || !spotifyService.accessToken) {
      setResults([]);
      return;
    }

    let isCancelled = false;

    const searchTracks = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const tracks = await spotifyService.searchTracks(query);
        
        if (!isCancelled) {
          setResults(tracks);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err as Error);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    searchTracks();

    return () => {
      isCancelled = true;
    };
  }, [query]);

  return { results, isLoading, error };
} 