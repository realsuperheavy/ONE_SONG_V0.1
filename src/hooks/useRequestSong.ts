import { useState } from 'react';
import type { SpotifyTrack } from '@/types';

export function useRequestSong(eventId: string, userId: string) {
  const [isRequesting, setIsRequesting] = useState(false);

  const requestSong = async (track: SpotifyTrack) => {
    setIsRequesting(true);
    try {
      await fetch('/api/request-song', {
        method: 'POST',
        body: JSON.stringify({ eventId, userId, track }),
      });
    } catch (error) {
      console.error('Failed to request song:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  return { requestSong, isRequesting };
} 