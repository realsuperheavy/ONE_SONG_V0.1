import { useState, useEffect } from 'react';

interface Track {
  title: string;
  artist: string;
  albumArt?: string;
  duration: number;
}

export function useCurrentTrack(eventId: string) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // TODO: Implement actual track fetching logic here
  useEffect(() => {
    // Placeholder for API call
    setIsLoading(false);
  }, [eventId]);

  return { currentTrack, progress, isLoading };
} 