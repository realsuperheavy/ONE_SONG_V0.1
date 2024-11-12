import { createContext, useContext, useEffect, useState } from 'react';
import { PlaybackController } from './PlaybackController';
import { useQueue } from '@/hooks/useQueue';
import { SpotifyTrack } from '@/types/spotify';

interface PlaybackContextType {
  isPlaying: boolean;
  currentTrack: SpotifyTrack | null;
  progress: number;
  duration: number;
  volume: number;
  play: (track?: SpotifyTrack) => Promise<void>;
  pause: () => void;
  resume: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
}

const PlaybackContext = createContext<PlaybackContextType | null>(null);

export function PlaybackProvider({ 
  eventId, 
  children 
}: { 
  eventId: string;
  children: React.ReactNode;
}) {
  const controller = new PlaybackController(eventId);
  const { queue } = useQueue(eventId);
  const [state, setState] = useState(controller.getState());

  useEffect(() => {
    controller.initialize();
    return () => controller.cleanup();
  }, []);

  useEffect(() => {
    controller.updateQueue(queue);
  }, [queue]);

  useEffect(() => {
    if (!state.isPlaying) return;
    
    const cleanup = controller.startPlayback();
    return () => cleanup();
  }, [state.isPlaying, controller]);

  useEffect(() => {
    const handleStateChange = (state: PlaybackState) => {
      setState(state);
    };
    
    controller.subscribe(handleStateChange);
    return () => controller.unsubscribe(handleStateChange);
  }, [controller]);

  const value: PlaybackContextType = {
    ...state,
    play: async (track) => {
      if (track) {
        await controller.playTrack(track);
      } else {
        controller.resume();
      }
      setState(controller.getState());
    },
    pause: () => {
      controller.pause();
      setState(controller.getState());
    },
    resume: () => {
      controller.resume();
      setState(controller.getState());
    },
    seek: (time) => {
      controller.seek(time);
      setState(controller.getState());
    },
    setVolume: (volume) => {
      controller.setVolume(volume);
      setState(controller.getState());
    }
  };

  return (
    <PlaybackContext.Provider value={value}>
      {children}
    </PlaybackContext.Provider>
  );
}

export function usePlayback() {
  const context = useContext(PlaybackContext);
  if (!context) {
    throw new Error('usePlayback must be used within a PlaybackProvider');
  }
  return context;
} 