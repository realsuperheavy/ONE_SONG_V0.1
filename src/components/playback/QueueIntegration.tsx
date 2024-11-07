import { useEffect } from 'react';
import { usePlayback } from '@/lib/playback/PlaybackContext';
import { useQueue } from '@/hooks/useQueue';
import { analyticsService } from '@/lib/firebase/services/analytics';

export function QueueIntegration({ eventId }: { eventId: string }) {
  const { queue } = useQueue(eventId);
  const { currentTrack, play } = usePlayback();

  useEffect(() => {
    if (!currentTrack && queue.length > 0) {
      // Auto-play first track in queue if nothing is playing
      play(queue[0].song);
      
      analyticsService.trackEvent('queue_autoplay', {
        eventId,
        trackId: queue[0].song.id
      });
    }
  }, [queue, currentTrack, play, eventId]);

  return null; // This is a logic-only component
} 