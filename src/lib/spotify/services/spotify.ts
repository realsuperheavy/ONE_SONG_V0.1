import SpotifyWebApi from 'spotify-web-api-node';
import { analyticsService } from '@/lib/firebase/services/analytics';
import type { SpotifyApiTrack } from '@/types/spotify';

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});

export const spotifyService = {
  searchTracks: async (query: string): Promise<SpotifyApiTrack[]> => {
    try {
      const response = await spotifyApi.searchTracks(query, { limit: 10 });
      
      analyticsService.trackEvent('spotify_search', {
        query,
        resultCount: response.body.tracks?.items.length || 0
      });

      return response.body.tracks?.items || [];
    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'spotify_search',
        query
      });
      throw error;
    }
  },

  getTrack: async (trackId: string): Promise<SpotifyApiTrack> => {
    try {
      const response = await spotifyApi.getTrack(trackId);
      
      analyticsService.trackEvent('spotify_get_track', {
        trackId,
        success: true
      });

      return response.body;
    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'spotify_get_track',
        trackId
      });
      throw error;
    }
  }
}; 