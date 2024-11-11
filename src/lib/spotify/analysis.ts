import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { Cache } from '@/lib/cache';
import { analyticsService } from '../firebase/services/analytics';

interface AudioFeatures {
  tempo: number;
  key: number;
  mode: number;
  danceability: number;
  energy: number;
  valence: number;
}

export class SpotifyAnalysisService {
  private cache: Cache;
  private api: SpotifyApi;

  constructor() {
    this.cache = new Cache('spotify_analysis');
    this.api = SpotifyApi.withClientCredentials(
      process.env.SPOTIFY_CLIENT_ID!,
      process.env.SPOTIFY_CLIENT_SECRET!
    );
  }

  async getTrackFeatures(trackId: string): Promise<AudioFeatures> {
    const cached = await this.cache.get(`features_${trackId}`);
    if (cached) return cached;

    try {
      const features = await this.api.audio_features.get(trackId);
      const result = {
        tempo: features.tempo,
        key: features.key,
        mode: features.mode,
        danceability: features.danceability,
        energy: features.energy,
        valence: features.valence
      };

      await this.cache.set(`features_${trackId}`, result, 86400); // 24 hours
      return result;
    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'spotify_analysis',
        trackId
      });
      throw error;
    }
  }

  async findSimilarTracks(trackId: string, limit = 5): Promise<SpotifyTrack[]> {
    const features = await this.getTrackFeatures(trackId);
    const recommendations = await this.api.recommendations.get({
      seed_tracks: [trackId],
      target_tempo: features.tempo,
      target_energy: features.energy,
      target_danceability: features.danceability,
      limit
    });

    return recommendations.tracks.map(track => ({
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
  }
} 