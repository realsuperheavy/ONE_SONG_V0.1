import { useState, useCallback, useRef, useEffect } from 'react';
import { SpotifyTrack } from './useSpotifySearch';

interface UseSpotifyPlaybackOptions {
  onPlaybackStart?: () => void;
  onPlaybackEnd?: () => void;
  onPlaybackError?: (error: Error) => void;
}

export function useSpotifyPlayback(options: UseSpotifyPlaybackOptions = {}) {
  const { onPlaybackStart, onPlaybackEnd, onPlaybackError } = options;
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressInterval = useRef<NodeJS.Timer>();

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    setProgress(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const play = useCallback(async (track: SpotifyTrack) => {
    if (!track.previewUrl) {
      onPlaybackError?.(new Error('No preview URL available'));
      return;
    }

    try {
      cleanup();

      audioRef.current = new Audio(track.previewUrl);
      setCurrentTrack(track);

      // Setup audio event listeners
      audioRef.current.addEventListener('play', () => {
        setIsPlaying(true);
        onPlaybackStart?.();
      });

      audioRef.current.addEventListener('ended', () => {
        cleanup();
        onPlaybackEnd?.();
      });

      audioRef.current.addEventListener('error', (e) => {
        cleanup();
        onPlaybackError?.(new Error('Failed to play preview'));
      });

      // Start playback
      await audioRef.current.play();

      // Setup progress tracking
      progressInterval.current = setInterval(() => {
        if (audioRef.current) {
          setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
        }
      }, 100);
    } catch (error) {
      cleanup();
      onPlaybackError?.(error as Error);
    }
  }, [cleanup, onPlaybackStart, onPlaybackEnd, onPlaybackError]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const resume = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, []);

  const stop = useCallback(() => {
    cleanup();
  }, [cleanup]);

  const seek = useCallback((percentage: number) => {
    if (audioRef.current) {
      const time = (percentage / 100) * audioRef.current.duration;
      audioRef.current.currentTime = time;
      setProgress(percentage);
    }
  }, []);

  return {
    isPlaying,
    currentTrack,
    progress,
    play,
    pause,
    resume,
    stop,
    seek
  };
} 