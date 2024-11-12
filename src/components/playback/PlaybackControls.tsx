import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { AdvancedPlaybackController } from '@/lib/playback/AdvancedPlaybackController';
import { QueueManager } from '@/lib/queue/QueueManager';
import { analyticsService } from '@/lib/firebase/services/analytics';
import { useEventData } from '@/hooks/useEventData';
import { PauseIcon, PlayIcon, SkipForwardIcon } from 'lucide-react';
import { QueueItem as FirebaseQueueItem } from '@/lib/firebase/services/queue';

interface PlaybackControlsProps {
  eventId: string;
  onError?: (error: Error) => void;
}

// Rename the local interface to avoid conflict
interface LocalQueueItem {
  id: string;
  songId: string;
  requestId: string;
  position: number;
  userId: string;
  queuePosition: number;
  addedAt: string;
  eventId: string;
  status: "pending" | "approved" | "rejected" | "played";
  metadata: {
    requestTime: number;
    votes: number;
  };
  song: {
    id: string;
    title: string;
    artist: string;
    albumArt?: string;
    previewUrl?: string;
    duration: number;
  };
}

// Add conversion function
const convertToLocalQueueItem = (item: FirebaseQueueItem): LocalQueueItem => {
  return {
    id: item.id,
    songId: item.song.id,
    requestId: item.id, // Using item.id as requestId
    position: item.queuePosition,
    userId: item.userId,
    queuePosition: item.queuePosition,
    addedAt: item.addedAt,
    eventId: item.eventId,
    status: item.status,
    metadata: {
      requestTime: item.metadata.requestTime,
      votes: item.metadata.votes
    },
    song: {
      id: item.song.id,
      title: item.song.title,
      artist: item.song.artist,
      albumArt: item.song.albumArt,
      previewUrl: item.song.previewUrl,
      duration: item.song.duration
    }
  };
};

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  eventId,
  onError
}) => {
  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [currentTrack, setCurrentTrack] = useState<LocalQueueItem | null>(null);
  const [nextTrack, setNextTrack] = useState<LocalQueueItem | null>(null);

  // Refs
  const playbackControllerRef = useRef<AdvancedPlaybackController | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Hooks
  const { queue } = useEventData(eventId);

  useEffect(() => {
    // Initialize playback controller
    playbackControllerRef.current = new AdvancedPlaybackController(eventId);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      playbackControllerRef.current?.cleanup();
    };
  }, []);

  useEffect(() => {
    if (!queue?.length) return;
    
    // Update current and next tracks
    const currentIndex = queue.findIndex(item => item.id === currentTrack?.id);
    const nextIndex = currentIndex + 1;
    
    if (currentIndex === -1 && !currentTrack) {
      setCurrentTrack(convertToLocalQueueItem(queue[0]));
    }
    
    if (nextIndex < queue.length) {
      setNextTrack(convertToLocalQueueItem(queue[nextIndex]));
    } else {
      setNextTrack(null);
    }
  }, [queue, currentTrack]);

  const startProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    progressIntervalRef.current = setInterval(() => {
      const current = playbackControllerRef.current?.getCurrentTime() || 0;
      const total = playbackControllerRef.current?.getDuration() || 0;
      setProgress((current / total) * 100);
    }, 100);
  };

  const handlePlay = async () => {
    try {
      if (!currentTrack) return;

      if (!isPlaying) {
        await playbackControllerRef.current?.play();
        setIsPlaying(true);
        startProgressTracking();

        analyticsService.trackEvent('playback_started', {
          trackId: currentTrack.song.id,
          eventId
        });
      } else {
        await playbackControllerRef.current?.pause();
        setIsPlaying(false);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }

        analyticsService.trackEvent('playback_paused', {
          trackId: currentTrack.song.id,
          eventId
        });
      }
    } catch (error) {
      onError?.(error as Error);
      analyticsService.trackError(error as Error, {
        context: 'playback_controls',
        action: 'play_pause'
      });
    }
  };

  const handleNext = async () => {
    try {
      if (!nextTrack) return;

      // Prepare next track before transition
      await playbackControllerRef.current?.prepareNextTrack(nextTrack);
      
      // Execute transition
      await playbackControllerRef.current?.transitionToNext(nextTrack);
      
      // Update state
      setCurrentTrack(nextTrack);
      setProgress(0);
      
      analyticsService.trackEvent('track_skipped', {
        fromTrackId: currentTrack?.song.id,
        toTrackId: nextTrack.song.id,
        eventId
      });
    } catch (error) {
      onError?.(error as Error);
      analyticsService.trackError(error as Error, {
        context: 'playback_controls',
        action: 'next_track'
      });
    }
  };

  // Fix handleVolumeChange type
  const handleVolumeChange = (value: number[]): void => {
    setVolume(value[0]);
    playbackControllerRef.current?.setVolume(value[0]);
    
    analyticsService.trackEvent('volume_changed', {
      value: value[0],
      trackId: currentTrack?.song.id,
      eventId
    });
  };

  const handleSeek = (value: number) => {
    const duration = playbackControllerRef.current?.getDuration() || 0;
    const time = (value / 100) * duration;
    playbackControllerRef.current?.seek(time);
    setProgress(value);

    analyticsService.trackEvent('playback_seeked', {
      position: value,
      trackId: currentTrack?.song.id,
      eventId
    });
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background-light p-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center space-x-4">
        {/* Track Info */}
        <div className="flex-1 min-w-0">
          {currentTrack && (
            <div className="truncate">
              <p className="font-medium">{currentTrack.song.title}</p>
              <p className="text-sm text-gray-500">{currentTrack.song.artist}</p>
            </div>
          )}
        </div>

        {/* Playback Controls */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            disabled={!nextTrack}
            aria-label="Next track"
          >
            <SkipForwardIcon />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="flex-1">
          <Slider
            value={progress}
            onChange={handleSeek}
            min={0}
            max={100}
            step={0.1}
            aria-label="Playback progress"
          />
        </div>

        {/* Volume Control */}
        <div className="w-32">
          <Slider
            value={volume * 100}
            onChange={(value: number[]) => handleVolumeChange(value)}
            min={0}
            max={100}
            step={1}
            aria-label="Volume"
          />
        </div>
      </div>
    </div>
  );
}; 