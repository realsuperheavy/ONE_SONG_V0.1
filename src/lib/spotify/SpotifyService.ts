import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { Cache } from '@/lib/cache';
import { analytics } from '@/lib/firebase/config';
import { logEvent } from '@firebase/analytics';

interface SpotifyTrack {
  id: string;
  name: string;
  artists: string[];
  album: {
    name: string;
    images: { url: string; width: number; height: number }[];
  };
  duration_ms: number;
  preview_url: string | null;
  uri: string;
}

interface AudioFeatures {
  tempo: number;      // BPM
  energy: number;     // 0.0 to 1.0
  danceability: number; // 0.0 to 1.0
  key: number;
  mode: number;       // 0 = minor, 1 = major
  valence: number;    // 0.0 to 1.0
}

export class SpotifyService {
  private static instance: SpotifyService;
  private api: SpotifyApi;
  private cache: Cache<any>;
  private readonly CACHE_TTL = 3600000; // 1 hour

  private constructor() {
    this.api = SpotifyApi.withClientCredentials(
      process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!,
      process.env.SPOTIFY_CLIENT_SECRET!
    );
    this.cache = new Cache({ ttl: this.CACHE_TTL });
  }

  static getInstance(): SpotifyService {
    if (!SpotifyService.instance) {
      SpotifyService.instance = new SpotifyService();
    }
    return SpotifyService.instance;
  }

  async searchTracks(query: string, limit: number = 10): Promise<SpotifyTrack[]> {
    const cacheKey = `search:${query}:${limit}`;
    const cached = await this.cache.get(cacheKey);
    
    if (cached) return cached;

    try {
      const response = await this.api.search(query, ['track'], undefined, limit);
      const tracks = response.tracks.items.map(this.normalizeTrack);
      
      await this.cache.set(cacheKey, tracks);
      return tracks;
    } catch (error) {
      this.logError('search_tracks', error as Error);
      throw error;
    }
  }

  async getAudioFeatures(trackId: string): Promise<AudioFeatures> {
    const cacheKey = `features:${trackId}`;
    const cached = await this.cache.get(cacheKey);
    
    if (cached) return cached;

    try {
      const features = await this.api.tracks.audioFeatures(trackId);
      await this.cache.set(cacheKey, features);
      return features;
    } catch (error) {
      this.logError('get_audio_features', error as Error);
      throw error;
    }
  }

  async getRecommendations(seedTracks: string[], targetEnergy?: number): Promise<SpotifyTrack[]> {
    const cacheKey = `recommendations:${seedTracks.join(',')}:${targetEnergy}`;
    const cached = await this.cache.get(cacheKey);
    
    if (cached) return cached;

    try {
      const params: any = {
        seed_tracks: seedTracks.slice(0, 5),
        limit: 20
      };

      if (targetEnergy !== undefined) {
        params.target_energy = targetEnergy;
      }

      const response = await this.api.recommendations.get(params);
      const tracks = response.tracks.map(this.normalizeTrack);
      
      await this.cache.set(cacheKey, tracks);
      return tracks;
    } catch (error) {
      this.logError('get_recommendations', error as Error);
      throw error;
    }
  }

  private normalizeTrack(track: any): SpotifyTrack {
    return {
      id: track.id,
      name: track.name,
      artists: track.artists.map((a: any) => a.name),
      album: {
        name: track.album.name,
        images: track.album.images
      },
      duration_ms: track.duration_ms,
      preview_url: track.preview_url,
      uri: track.uri
    };
  }

  private logError(operation: string, error: Error): void {
    if (analytics) {
      logEvent(analytics, 'spotify_error', {
        operation,
        error: error.message,
        timestamp: Date.now()
      });
    }
  }
}

export const spotifyService = SpotifyService.getInstance(); 