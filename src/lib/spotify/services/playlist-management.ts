import { spotifyApi } from '../config';
import { analyticsService } from '@/lib/firebase/services/analytics';
import { Cache } from '@/lib/cache';
import { AppError } from '@/lib/error/AppError';

export class PlaylistManagementService {
  private cache: Cache;

  constructor() {
    this.cache = new Cache('playlists', 60 * 5); // 5 minute cache
  }

  async createEventPlaylist(eventId: string, name: string, description?: string) {
    try {
      const user = await spotifyApi.getMe();
      const playlist = await spotifyApi.createPlaylist(user.id, {
        name,
        description: description || `OneSong Event Playlist - ${eventId}`,
        public: false
      });

      analyticsService.trackEvent('playlist_created', {
        eventId,
        playlistId: playlist.id
      });

      return playlist;
    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'create_playlist',
        eventId
      });
      throw error;
    }
  }

  async addTracksToPlaylist(playlistId: string, trackUris: string[]) {
    try {
      // Add tracks in batches of 100 (Spotify API limit)
      for (let i = 0; i < trackUris.length; i += 100) {
        const batch = trackUris.slice(i, i + 100);
        await spotifyApi.addTracksToPlaylist(playlistId, batch);
      }

      analyticsService.trackEvent('tracks_added_to_playlist', {
        playlistId,
        trackCount: trackUris.length
      });
    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'add_tracks_to_playlist',
        playlistId
      });
      throw error;
    }
  }

  async reorderPlaylist(playlistId: string, startIndex: number, endIndex: number) {
    try {
      await spotifyApi.reorderTracksInPlaylist(playlistId, startIndex, endIndex);
      
      analyticsService.trackEvent('playlist_reordered', {
        playlistId,
        startIndex,
        endIndex
      });
    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'reorder_playlist',
        playlistId
      });
      throw error;
    }
  }

  async getPlaylistTracks(playlistId: string) {
    try {
      const cacheKey = `playlist_tracks_${playlistId}`;
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await spotifyApi.getPlaylistTracks(playlistId);
      await this.cache.set(cacheKey, response.items);
      
      return response.items;
    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'get_playlist_tracks',
        playlistId
      });
      throw error;
    }
  }
} 