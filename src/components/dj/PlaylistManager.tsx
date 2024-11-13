'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { TrackManagement } from './TrackManagement';
import { useEventStore } from '@/store/event';
import { useSpotify } from '@/lib/spotify/SpotifyContext';
import { analyticsService } from '@/lib/firebase/services/analytics';
import { PerformanceMonitor } from '@/lib/monitoring/PerformanceMonitor';
import type { SpotifyApiTrack } from '@/types/spotify';

interface PlaylistManagerProps {
  eventId: string;
  isAttendee?: boolean;
}

export function PlaylistManager({ eventId, isAttendee = true }: PlaylistManagerProps) {
  const [currentTrack, setCurrentTrack] = useState<SpotifyApiTrack | null>(null);
  const { currentEvent } = useEventStore();
  const { initialized, error } = useSpotify();
  const performanceMonitor = PerformanceMonitor.getInstance();

  useEffect(() => {
    if (currentEvent?.currentTrack) {
      performanceMonitor.startOperation('setCurrentTrack');
      setCurrentTrack(currentEvent.currentTrack);
      performanceMonitor.endOperation('setCurrentTrack');

      analyticsService.trackEvent('track_view', {
        eventId,
        trackId: currentEvent.currentTrack.id,
        userType: isAttendee ? 'attendee' : 'dj',
        duration: performanceMonitor.getMetrics().responseTime
      });
    }
  }, [currentEvent?.currentTrack, eventId, isAttendee]);

  if (!initialized || error || !currentTrack) {
    return null;
  }

  return (
    <Card className="p-4">
      <TrackManagement
        track={currentTrack}
        isAttendee={isAttendee}
      />
    </Card>
  );
} 