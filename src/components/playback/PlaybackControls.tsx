'use client';

import { useEffect, useState } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { AdvancedPlaybackController } from '@/lib/playback/AdvancedPlaybackController';
import { PerformanceMetricsCollector } from '@/lib/monitoring/PerformanceMetricsCollector';
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
  const [playbackController] = useState(() => new AdvancedPlaybackController());
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const performanceMonitor = new PerformanceMetricsCollector();

  useEffect(() => {
    let mounted = true;

    const initializePlayback = async () => {
      if (!previewUrl) return;

      performanceMonitor.startOperation('playbackInit');
      try {
        await playbackController.initializeAudio(previewUrl);
        
        // Subscribe to playback state
        const unsubscribe = playbackController.subscribe((state) => {
          if (!mounted) return;
          
          setProgress(state.currentTime / state.duration * 100);
          
          if (state.currentTime >= state.duration && isPlaying) {
            setIsPlaying(false);
            onPlaybackEnd?.();
          }
        });

        performanceMonitor.endOperation('playbackInit');
        return unsubscribe;
      } catch (error) {
        performanceMonitor.trackError('playbackInit');
        analyticsService.trackError(error as Error, {
          context: 'playback_initialization',
          songTitle,
          previewUrl
        });
      }
    };

    initializePlayback();

    return () => {
      mounted = false;
      playbackController.dispose();
      performanceMonitor.dispose();
    };
  }, [previewUrl, songTitle, onPlaybackEnd, playbackController]);

  const handlePlayPause = async () => {
    performanceMonitor.startOperation('playbackToggle');
    
    try {
      if (isPlaying) {
        playbackController.pause();
        setIsPlaying(false);
        
        analyticsService.trackEvent('playback_paused', {
          songTitle,
          progress,
          userType: isAttendee ? 'attendee' : 'dj'
        });
      } else {
        await playbackController.play();
        setIsPlaying(true);
        onPlaybackStart?.();
        
        analyticsService.trackEvent('playback_started', {
          songTitle,
          userType: isAttendee ? 'attendee' : 'dj'
        });
      }
      
      performanceMonitor.endOperation('playbackToggle');
    } catch (error) {
      performanceMonitor.trackError('playbackToggle');
      analyticsService.trackError(error as Error, {
        context: 'playback_toggle',
        songTitle,
        isPlaying
      });
    }
  };

  const handleVolumeChange = (value: number) => {
    playbackController.setVolume(value / 100);
    setIsMuted(value === 0);
    
    analyticsService.trackEvent('volume_changed', {
      songTitle,
      volume: value,
      isMuted: value === 0
    });
  };

  if (!previewUrl) {
    return (
      <div className="text-sm text-gray-500">
        No preview available
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={handlePlayPause}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
      </Button>

      <div className="flex-1">
        <Slider
          value={[progress]}
          max={100}
          step={1}
          aria-label="Playback progress"
          className="w-full"
          onValueChange={([value]) => {
            const time = (value / 100) * playbackController.getState().duration;
            playbackController.seek(time);
          }}
        />
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleVolumeChange(isMuted ? 100 : 0)}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? (
          <VolumeX className="h-6 w-6" />
        ) : (
          <Volume2 className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
} 