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
      // Check rate limit before search
      const canProceed = await this.rateLimiter.checkRateLimit(userId, 'search');
      if (!canProceed) {
        throw new AppError({
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Search limit exceeded. Please try again later.',
          context: { userId }
        });
      }

      // Check cache first
      const cacheKey = `search_${query}`;
      const cached = await this.searchCache.get(cacheKey);
      if (cached) return cached;

      // Search using client credentials (no user auth needed)
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
      await this.searchCache.set(cacheKey, tracks, 300); // Cache for 5 minutes
      return tracks;

    } catch (error) {
      if (error instanceof AppError) throw error;
      
      analyticsService.trackError(error as Error, {
        context: 'spotify_search',
        query
      });
      throw new AppError({
        code: 'OPERATION_FAILED',
        message: 'Search operation failed', 
        context: { query, error: error instanceof Error ? error.message : String(error) }
      });
    }
  }

  async getTrackDetails(trackId: string): Promise<SpotifyTrack> {
    try {
      // Check cache first
      const cacheKey = `track_${trackId}`;
      const cached = await this.trackCache.get(cacheKey);
      if (cached) return cached;

      // Get track details using client credentials
      const track = await this.api.tracks.get(trackId);
      
      const trackData: SpotifyTrack = {
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
      };

      // Cache results
      await this.trackCache.set(cacheKey, trackData, 3600); // Cache for 1 hour
      return trackData;

    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'spotify_track_details',
        trackId
      });
      throw error;
    }
  }
}