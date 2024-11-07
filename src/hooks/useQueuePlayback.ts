import { useState, useCallback, useRef, useEffect } from 'react';
import { QueueItem } from '@/lib/firebase/services/queue';

interface UseQueuePlaybackOptions {
  onPlayNext?: () => void;
  onPlayPrevious?: () => void;
  onComplete?: () => void;
}

export function useQueuePlayback(options: UseQueuePlaybackOptions = {}) {
  const { onPlayNext, onPlayPrevious, onComplete } = options;
  const [currentTrack, setCurrentTrack] = useState<QueueItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!currentTrack?.song.previewUrl) return;

    audioRef.current = new Audio(currentTrack.song.previewUrl);
    audioRef.current.addEventListener('ended', () => {
      setIsPlaying(false);
      setProgress(0);
      onComplete?.();
    });

    audioRef.current.addEventListener('timeupdate', () => {
      if (!audioRef.current) return;
      setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
    });

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [currentTrack, onComplete]);

  const play = useCallback((track: QueueItem) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    audioRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
    audioRef.current?.pause();
  }, []);

  const stop = useCallback(() => {
    setIsPlaying(false);
    setCurrentTrack(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  const seek = useCallback((percentage: number) => {
    if (!audioRef.current) return;
    const time = (percentage / 100) * audioRef.current.duration;
    audioRef.current.currentTime = time;
  }, []);

  return {
    currentTrack,
    isPlaying,
    progress,
    play,
    pause,
    stop,
    seek
  };
} 