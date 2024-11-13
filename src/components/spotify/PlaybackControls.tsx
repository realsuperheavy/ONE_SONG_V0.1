'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { analyticsService } from '@/lib/firebase/services/analytics';

interface PlaybackControlsProps {
  previewUrl: string | null;
  songTitle: string;
  onPlaybackStart?: () => void;
  onPlaybackEnd?: () => void;
  isAttendee?: boolean;
}

export function PlaybackControls({
  previewUrl,
  songTitle,
  onPlaybackStart,
  onPlaybackEnd,
  isAttendee = true
}: PlaybackControlsProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (previewUrl) {
      audioRef.current = new Audio(previewUrl);
      audioRef.current.addEventListener('ended', handlePlaybackEnd);
      audioRef.current.addEventListener('error', handlePlaybackError);
      audioRef.current.addEventListener('canplaythrough', handleCanPlayThrough);

      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('ended', handlePlaybackEnd);
          audioRef.current.removeEventListener('error', handlePlaybackError);
          audioRef.current.removeEventListener('canplaythrough', handleCanPlayThrough);
          audioRef.current.pause();
          audioRef.current = null;
        }
      };
    }
  }, [previewUrl]);

  const handleCanPlayThrough = () => {
    analyticsService.trackEvent('preview_ready', {
      songTitle,
      userType: isAttendee ? 'attendee' : 'dj'
    });
  };

  const handlePlaybackEnd = () => {
    setIsPlaying(false);
    onPlaybackEnd?.();
    analyticsService.trackEvent('preview_ended', {
      songTitle,
      userType: isAttendee ? 'attendee' : 'dj'
    });
  };

  const handlePlaybackError = (error: Event) => {
    setIsPlaying(false);
    showToast({
      title: "Playback Error",
      description: "Failed to play preview. Please try again.",
      variant: "destructive"
    });
    analyticsService.trackError(error as Error, {
      context: 'preview_playback',
      songTitle,
      previewUrl,
      userType: isAttendee ? 'attendee' : 'dj'
    });
  };

  const togglePlay = async () => {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        analyticsService.trackEvent('preview_paused', {
          songTitle,
          userType: isAttendee ? 'attendee' : 'dj'
        });
      } else {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
          onPlaybackStart?.();
          analyticsService.trackEvent('preview_started', {
            songTitle,
            userType: isAttendee ? 'attendee' : 'dj'
          });
        }
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      handlePlaybackError(error as Event);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
    analyticsService.trackEvent('preview_mute_toggled', {
      songTitle,
      muted: !isMuted,
      userType: isAttendee ? 'attendee' : 'dj'
    });
  };

  if (!previewUrl) {
    return <div className="text-sm text-gray-500">No preview available</div>;
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={togglePlay}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleMute}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </Button>
    </div>
  );
} 