import { useState, useCallback } from 'react';
import { useSpotifySearch, SpotifyTrack } from './useSpotifySearch';
import { useSpotifyPlayback } from './useSpotifyPlayback';
import { useQueue } from './useQueue';
import { useAuthStore } from '@/store/auth';
import { requestService } from '@/lib/firebase/services/request';

interface UseSpotifyRequestOptions {
  eventId: string;
  onRequestSuccess?: () => void;
  onRequestError?: (error: Error) => void;
}

export function useSpotifyRequest({ 
  eventId, 
  onRequestSuccess, 
  onRequestError 
}: UseSpotifyRequestOptions) {
  const user = useAuthStore((state) => state.user);
  const [requesting, setRequesting] = useState(false);
  const { addToQueue } = useQueue(eventId);

  const {
    results: searchResults,
    loading: searching,
    error: searchError,
    search
  } = useSpotifySearch();

  const {
    isPlaying,
    currentTrack,
    progress,
    play,
    pause,
    resume,
    stop
  } = useSpotifyPlayback({
    onPlaybackError: (error) => {
      console.error('Playback error:', error);
    }
  });

  const makeRequest = useCallback(async (
    track: SpotifyTrack, 
    message?: string
  ) => {
    if (!user) {
      throw new Error('Must be logged in to make requests');
    }

    setRequesting(true);
    try {
      const requestId = await requestService.createRequest({
        eventId,
        userId: user.id,
        song: {
          id: track.id,
          title: track.title,
          artist: track.artist,
          albumArt: track.albumArt,
          duration: track.duration,
          previewUrl: track.previewUrl
        },
        metadata: {
          message,
          requestTime: new Date().toISOString(),
          votes: 0
        }
      });

      onRequestSuccess?.();
      return requestId;
    } catch (error) {
      onRequestError?.(error as Error);
      throw error;
    } finally {
      setRequesting(false);
    }
  }, [eventId, user, onRequestSuccess, onRequestError]);

  return {
    searchResults,
    searching,
    searchError,
    search,
    isPlaying,
    currentTrack,
    progress,
    requesting,
    play,
    pause,
    resume,
    stop,
    makeRequest
  };
} 