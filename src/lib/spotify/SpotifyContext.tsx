'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { SpotifyAuthFlow } from './auth/SpotifyAuthFlow';
import { spotifyService } from './services/spotify';
import { analyticsService } from '@/lib/firebase/services/analytics';
import { PerformanceMonitor } from '@/lib/monitoring/PerformanceMonitor';
import type { SpotifyApiTrack } from '@/types/spotify';

interface SpotifyContextType {
  initialized: boolean;
  error: Error | null;
  searchTracks: (query: string) => Promise<SpotifyApiTrack[]>;
  getTrack: (trackId: string) => Promise<SpotifyApiTrack>;
}

const SpotifyContext = createContext<SpotifyContextType | undefined>(undefined);
const performanceMonitor = PerformanceMonitor.getInstance();

export function SpotifyProvider({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initializeSpotify = async () => {
      performanceMonitor.startOperation('spotifyInitialization');
      try {
        await SpotifyAuthFlow.initializeApi();
        setInitialized(true);
        performanceMonitor.endOperation('spotifyInitialization');
        
        analyticsService.trackEvent('spotify_context_initialized', {
          success: true,
          duration: performanceMonitor.getMetrics().responseTime
        });
      } catch (error) {
        setError(error as Error);
        performanceMonitor.trackError('spotifyInitialization');
        analyticsService.trackError(error as Error, {
          context: 'spotify_context',
          action: 'initialize'
        });
      }
    };

    initializeSpotify();
  }, []);

  const contextValue: SpotifyContextType = {
    initialized,
    error,
    searchTracks: spotifyService.searchTracks,
    getTrack: spotifyService.getTrack
  };

  return (
    <SpotifyContext.Provider value={contextValue}>
      {children}
    </SpotifyContext.Provider>
  );
}

export function useSpotify() {
  const context = useContext(SpotifyContext);
  if (context === undefined) {
    throw new Error('useSpotify must be used within a SpotifyProvider');
  }
  return context;
} 