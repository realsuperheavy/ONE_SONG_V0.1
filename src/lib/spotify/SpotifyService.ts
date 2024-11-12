import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { Cache } from '@/lib/cache';
import { analyticsService } from '../firebase/services/analytics';
import type { SpotifyTrack } from '@/types/models';
import { RateLimitService } from '../firebase/services/rate-limit';
import { AppError } from '@/lib/error/AppError';

export class SpotifyService {
  private api: SpotifyApi;
  private searchCache: Cache<SpotifyTrack[]>;
  private trackCache: Cache<SpotifyTrack>;
  private rateLimiter: RateLimitService;

  constructor() {
    this.api = SpotifyApi.withClientCredentials(
      process.env.SPOTIFY_CLIENT_ID!,
      process.env.SPOTIFY_CLIENT_SECRET!
    );
    this.searchCache = new Cache<SpotifyTrack[]>({
      maxSize: 100,
      ttl: 300 // 5 minutes
    });
    this.trackCache = new Cache<SpotifyTrack>({
      maxSize: 1000,
      ttl: 3600 // 1 hour
    });
    this.rateLimiter = new RateLimitService();
  }

  async searchTracks(query: string, userId: string): Promise<SpotifyTrack[]> {
    try {
      // Check rate limit
      const canProceed = await this.rateLimiter.checkRateLimit(userId, 'search');
      if (!canProceed) {
        throw new AppError({
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Search limit exceeded',
          context: { userId }
        });
      }

      // Check cache
      const cacheKey = `search_${query}`;
      const cached = await this.searchCache.get(cacheKey);
      if (cached) return cached;

      // Perform search
      const response = await this.api.search(query, ['track'], 'US', 20);
      
      const tracks = response.tracks.items.map(track => ({
        id: track.id,
        name: track.name,
        artists: track.artists.map(artist => ({
          id: artist.id,
          name: artist.name
        })),
        album: {
          id: track.album.id,
          name: track.album.name,
          images: track.album.images
        },
        duration_ms: track.duration_ms,
        uri: track.uri
      }));

      // Cache results
      await this.searchCache.set(cacheKey, tracks);
      
      analyticsService.trackEvent('spotify_search', {
        userId,
        query,
        resultCount: tracks.length
      });

      return tracks;
    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'spotify_search',
        query,
        userId
      });
      throw error;
    }
  }

  async getTrackAnalysis(trackId: string): Promise<{
    tempo: number;
    key: number;
    mode: number;
    timeSignature: number;
    danceability: number;
    energy: number;
  }> {
    try {
      const cacheKey = `analysis_${trackId}`;
      const cached = await this.trackCache.get(cacheKey);
      if (cached) return cached;

      const analysis = await this.api.audio_features(trackId);
      await this.trackCache.set(cacheKey, analysis);
      
      return analysis;
    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'spotify_analysis',
        trackId
      });
      throw error;
    }
  }

  async createPlaylist(userId: string, eventId: string, name: string): Promise<string> {
    try {
      const playlist = await this.api.playlists.createPlaylist(userId, {
        name,
        description: `OneSong Event Playlist - ${eventId}`,
        public: false
      });

      analyticsService.trackEvent('playlist_created', {
        userId,
        eventId,
        playlistId: playlist.id
      });

      return playlist.id;
    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'create_playlist',
        userId,
        eventId
      });
      throw error;
    }
  }

  async addTracksToPlaylist(playlistId: string, trackUris: string[]): Promise<void> {
    try {
      await this.api.playlists.addItemsToPlaylist(playlistId, trackUris);
    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'add_tracks_playlist',
        playlistId
      });
      throw error;
    }
  }
}

export const spotifyService = new SpotifyService();