import { useState, useEffect, useCallback } from 'react';
import { Cache } from '@/lib/cache';

interface PlaybackState {
  isPlaying: boolean;
  currentTrack: string | null;
  progress: number;
}

export function useSpotifyPlayback() {
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    currentTrack: null,
    progress: 0
  });
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const cache = new Cache<ArrayBuffer>();

  const preloadTrack = useCallback(async (previewUrl: string) => {
    if (!previewUrl) return;

    const cached = await cache.get(previewUrl);
    if (cached) return;

    try {
      const response = await fetch(previewUrl);
      const buffer = await response.arrayBuffer();
      await cache.set(previewUrl, buffer);
    } catch (error) {
      console.error('Failed to preload track:', error);
    }
  }, []);

  const playPreview = useCallback(async (previewUrl: string | null) => {
    if (!previewUrl) return;

    if (audio) {
      audio.pause();
      audio.src = '';
    }

    const newAudio = new Audio(previewUrl);
    newAudio.addEventListener('timeupdate', () => {
      setPlaybackState(prev => ({
        ...prev,
        progress: (newAudio.currentTime / newAudio.duration) * 100
      }));
    });

    newAudio.addEventListener('ended', () => {
      setPlaybackState({
        isPlaying: false,
        currentTrack: null,
        progress: 0
      });
    });

    try {
      await newAudio.play();
      setAudio(newAudio);
      setPlaybackState({
        isPlaying: true,
        currentTrack: previewUrl,
        progress: 0
      });
    } catch (error) {
      console.error('Playback failed:', error);
    }
  }, [audio]);

  const stopPreview = useCallback(() => {
    if (audio) {
      audio.pause();
      audio.src = '';
      setAudio(null);
      setPlaybackState({
        isPlaying: false,
        currentTrack: null,
        progress: 0
      });
    }
  }, [audio]);

  useEffect(() => {
    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  }, [audio]);

  return {
    playbackState,
    playPreview,
    stopPreview,
    preloadTrack
  };
} 