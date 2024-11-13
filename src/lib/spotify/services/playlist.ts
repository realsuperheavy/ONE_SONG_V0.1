import { spotifyApi } from '../config';
import { analyticsService } from '@/lib/firebase/services/analytics';
import { PerformanceMonitor } from '@/lib/monitoring/PerformanceMonitor';
import type { SpotifyApiTrack } from '@/types/spotify';

const performanceMonitor = PerformanceMonitor.getInstance();

export const playlistService = {
  getTrack: async (trackId: string): Promise<SpotifyApiTrack> => {
    performanceMonitor.startOperation('getSpotifyTrack');
    try {
      const response = await spotifyApi.getTrack(trackId);
      performanceMonitor.endOperation('getSpotifyTrack');
      
      analyticsService.trackEvent('spotify_track_fetched', {
        trackId,
        success: true,
        duration: performanceMonitor.getMetrics().responseTime
      });

      return response.body;
    } catch (error) {
      performanceMonitor.trackError('getSpotifyTrack');
      analyticsService.trackError(error as Error, {
        context: 'get_spotify_track',
        trackId
      });
      throw error;
    }
  },

  searchTracks: async (query: string, limit: number = 10): Promise<SpotifyApiTrack[]> => {
    performanceMonitor.startOperation('searchSpotifyTracks');
    try {
      const response = await spotifyApi.searchTracks(query, { limit });
      performanceMonitor.endOperation('searchSpotifyTracks');
      
      analyticsService.trackEvent('spotify_search_completed', {
        query,
        resultCount: response.body.tracks?.items.length || 0,
        duration: performanceMonitor.getMetrics().responseTime
      });

      return response.body.tracks?.items || [];
    } catch (error) {
      performanceMonitor.trackError('searchSpotifyTracks');
      analyticsService.trackError(error as Error, {
        context: 'search_spotify_tracks',
        query
      });
      throw error;
    }
  },

  getTrackPreview: async (trackId: string): Promise<string | null> => {
    performanceMonitor.startOperation('getTrackPreview');
    try {
      const track = await this.getTrack(trackId);
      performanceMonitor.endOperation('getTrackPreview');
      
      analyticsService.trackEvent('preview_url_fetched', {
        trackId,
        hasPreview: !!track.preview_url,
        duration: performanceMonitor.getMetrics().responseTime
      });

      return track.preview_url;
    } catch (error) {
      performanceMonitor.trackError('getTrackPreview');
      analyticsService.trackError(error as Error, {
        context: 'get_track_preview',
        trackId
      });
      return null;
    }
  }
}; 