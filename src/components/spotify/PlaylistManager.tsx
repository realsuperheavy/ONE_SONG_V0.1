'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { PlaybackControls } from '@/components/spotify/PlaybackControls';
import { useEventStore } from '@/store/event';
import { analyticsService } from '@/lib/firebase/services/analytics';
import type { SpotifyTrack } from '@/types/spotify';

interface PlaylistManagerProps {
  eventId: string;
  isAttendee?: boolean;
}

export function PlaylistManager({ eventId, isAttendee = true }: PlaylistManagerProps) {
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const { currentEvent } = useEventStore();

  useEffect(() => {
    if (currentEvent?.currentTrack) {
      setCurrentTrack(currentEvent.currentTrack);
      analyticsService.trackEvent('track_view', {
        eventId,
        trackId: currentEvent.currentTrack.id
      });
    }
  }, [currentEvent?.currentTrack, eventId]);

  if (!currentTrack) {
    return null;
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-4">
        {currentTrack.album.images[0] && (
          <img
            src={currentTrack.album.images[0].url}
            alt="Album art"
            className="w-16 h-16 rounded"
          />
        )}
        <div className="flex-1">
          <h3 className="font-medium">{currentTrack.name}</h3>
          <p className="text-sm text-gray-500">
            {currentTrack.artists.map(a => a.name).join(', ')}
          </p>
          {isAttendee && (
            <PlaybackControls
              previewUrl={currentTrack.preview_url}
              songTitle={currentTrack.name}
            />
          )}
        </div>
      </div>
    </Card>
  );
} 