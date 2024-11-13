'use client';

import { useState } from 'react';
import { PlaybackControls } from '@/components/spotify/PlaybackControls';
import { Card } from '@/components/ui/card';
import { useSpotify } from '@/lib/spotify/SpotifyContext';
import { analyticsService } from '@/lib/firebase/services/analytics';
import { PerformanceMonitor } from '@/lib/monitoring/PerformanceMonitor';
import type { SpotifyApiTrack } from '@/types/spotify';

interface TrackManagementProps {
  track: SpotifyApiTrack;
  isAttendee?: boolean;
}

export function TrackManagement({ track, isAttendee = true }: TrackManagementProps) {
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const { getTrackPreview } = useSpotify();
  const performanceMonitor = PerformanceMonitor.getInstance();

  const handlePreviewStart = async () => {
    performanceMonitor.startOperation('previewTrack');
    try {
      const previewUrl = await getTrackPreview(track.id);
      setIsPreviewPlaying(true);
      performanceMonitor.endOperation('previewTrack');

      analyticsService.trackEvent('track_preview_started', {
        trackId: track.id,
        trackName: track.name,
        userType: isAttendee ? 'attendee' : 'dj',
        duration: performanceMonitor.getMetrics().responseTime
      });
    } catch (error) {
      performanceMonitor.trackError('previewTrack');
      analyticsService.trackError(error as Error, {
        context: 'track_preview',
        trackId: track.id
      });
    }
  };

  const handlePreviewEnd = () => {
    setIsPreviewPlaying(false);
    analyticsService.trackEvent('track_preview_ended', {
      trackId: track.id,
      trackName: track.name,
      userType: isAttendee ? 'attendee' : 'dj'
    });
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-4">
        {track.album.images[0] && (
          <img
            src={track.album.images[0].url}
            alt="Album art"
            className="w-16 h-16 rounded"
          />
        )}
        <div className="flex-1">
          <h3 className="font-medium">{track.name}</h3>
          <p className="text-sm text-gray-500">
            {track.artists.map(a => a.name).join(', ')}
          </p>
          <div className="mt-2">
            <PlaybackControls
              previewUrl={track.preview_url}
              songTitle={track.name}
              onPlaybackStart={handlePreviewStart}
              onPlaybackEnd={handlePreviewEnd}
              isAttendee={isAttendee}
            />
          </div>
        </div>
      </div>
    </Card>
  );
} 