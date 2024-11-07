import { spotifyApi } from './api';
import { SpotifyTrack } from '@/hooks/useSpotifySearch';

interface SearchOptions {
  limit?: number;
  offset?: number;
  market?: string;
}

interface AudioFeatures {
  danceability: number;
  energy: number;
  key: number;
  loudness: number;
  mode: number;
  speechiness: number;
  acousticness: number;
  instrumentalness: number;
  liveness: number;
  valence: number;
  tempo: number;
  duration_ms: number;
  time_signature: number;
}

export const spotifyTrackService = {
  searchTracks: async (query: string, options: SearchOptions = {}): Promise<SpotifyTrack[]> => {
    const { data } = await spotifyApi.get('/search', {
      params: {
        q: query,
        type: 'track',
        limit: options.limit || 20,
        offset: options.offset || 0,
        market: options.market || 'US'
      }
    });

    return data.tracks.items.map((track: any) => ({
      id: track.id,
      title: track.name,
      artist: track.artists.map((a: any) => a.name).join(', '),
      albumArt: track.album.images[0]?.url,
      duration: track.duration_ms,
      previewUrl: track.preview_url,
      popularity: track.popularity,
      explicit: track.explicit
    }));
  },

  getAudioFeatures: async (trackId: string): Promise<AudioFeatures> => {
    const { data } = await spotifyApi.get(`/audio-features/${trackId}`);
    return data;
  },

  getRecommendations: async (
    seedTracks: string[],
    targetFeatures?: Partial<AudioFeatures>
  ): Promise<SpotifyTrack[]> => {
    const { data } = await spotifyApi.get('/recommendations', {
      params: {
        seed_tracks: seedTracks.join(','),
        limit: 20,
        ...targetFeatures
      }
    });

    return data.tracks.map((track: any) => ({
      id: track.id,
      title: track.name,
      artist: track.artists.map((a: any) => a.name).join(', '),
      albumArt: track.album.images[0]?.url,
      duration: track.duration_ms,
      previewUrl: track.preview_url,
      popularity: track.popularity,
      explicit: track.explicit
    }));
  }
}; 