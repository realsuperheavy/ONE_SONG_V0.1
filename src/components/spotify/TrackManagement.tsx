'use client';

import { useState } from 'react';
import { PlaybackControls } from '@/components/spotify/PlaybackControls';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSpotify } from '@/lib/spotify/SpotifyContext';
import { analyticsService } from '@/lib/firebase/services/analytics';
import type { SpotifyApiTrack } from '@/types/spotify';

interface TrackManagementProps {
  track: SpotifyApiTrack;
  onRequest?: () => void;
  isAttendee?: boolean;
}

export function TrackManagement({ track, onRequest, isAttendee = true }: TrackManagementProps) {
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const { previewTrack, stopPreview } = useSpotify();

  const handlePreviewStart = async () => {
    try {
      await previewTrack(track.id);
      setIsPreviewPlaying(true);
      analyticsService.trackEvent('track_preview_started', {
        trackId: track.id,
        trackName: track.name,
        userType: isAttendee ? 'attendee' : 'dj'
      });
    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'track_preview',
        trackId: track.id
      });
    }
  };

  const handlePreviewEnd = () => {
    stopPreview();
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
          <div className="flex items-center gap-2 mt-2">
            <PlaybackControls
              previewUrl={track.preview_url}
              songTitle={track.name}
              onPlaybackStart={handlePreviewStart}
              onPlaybackEnd={handlePreviewEnd}
              isAttendee={isAttendee}
            />
            {isAttendee && onRequest && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  onRequest();
                  analyticsService.trackEvent('track_request_initiated', {
                    trackId: track.id,
                    trackName: track.name
                  });
                }}
              >
                Request
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
} 