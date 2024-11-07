import { useEffect, useRef } from 'react';
import { usePlayback } from '@/lib/playback/PlaybackContext';
import { analyticsService } from '@/lib/firebase/services/analytics';

interface PlaybackMetrics {
  playCount: number;
  totalPlayTime: number;
  skips: number;
  averagePlayDuration: number;
}

export function PlaybackAnalytics({ eventId }: { eventId: string }) {
  const { currentTrack, isPlaying, progress } = usePlayback();
  const metricsRef = useRef<PlaybackMetrics>({
    playCount: 0,
    totalPlayTime: 0,
    skips: 0,
    averagePlayDuration: 0
  });

  const lastTrackRef = useRef<string | null>(null);
  const playStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (currentTrack?.id !== lastTrackRef.current) {
      // Track changed
      if (lastTrackRef.current) {
        metricsRef.current.skips++;
        analyticsService.trackEvent('track_skipped', {
          eventId,
          trackId: lastTrackRef.current,
          playDuration: progress
        });
      }

      if (currentTrack) {
        metricsRef.current.playCount++;
        playStartTimeRef.current = Date.now();
        
        analyticsService.trackEvent('track_started', {
          eventId,
          trackId: currentTrack.id,
          queuePosition: metricsRef.current.playCount
        });
      }

      lastTrackRef.current = currentTrack?.id || null;
    }
  }, [currentTrack, eventId, progress]);

  useEffect(() => {
    if (!isPlaying && playStartTimeRef.current) {
      const playDuration = Date.now() - playStartTimeRef.current;
      metricsRef.current.totalPlayTime += playDuration;
      metricsRef.current.averagePlayDuration = 
        metricsRef.current.totalPlayTime / metricsRef.current.playCount;

      analyticsService.trackEvent('track_completed', {
        eventId,
        trackId: currentTrack?.id,
        playDuration,
        averagePlayDuration: metricsRef.current.averagePlayDuration
      });

      playStartTimeRef.current = null;
    }
  }, [isPlaying, currentTrack, eventId]);

  return null; // This is a logic-only component
} 