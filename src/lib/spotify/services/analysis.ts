import { spotifyApi } from './api';
import { Cache } from '@/lib/cache';

interface AudioFeatures {
  bpm: number;
  key: number;
  mode: number;
  timeSignature: number;
  danceability: number;
  energy: number;
  acousticness: number;
  instrumentalness: number;
  liveness: number;
  valence: number;
}

const audioFeaturesCache = new Cache<AudioFeatures>({
  maxSize: 1000,
  ttl: 24 * 60 * 60 * 1000 // 24 hours
});

function calculateKeyCompatibility(key1: number, key2: number): number {
  // Camelot Wheel compatibility scoring
  const camelotWheel = [
    [1, 0.8, 0.6, 0.3, 0.1, 0, 0.1, 0.3, 0.6, 0.8, 1, 0.8], // Perfect match, relative major/minor
    [0.8, 1, 0.8, 0.6, 0.3, 0.1, 0, 0.1, 0.3, 0.6, 0.8, 1],
    [0.6, 0.8, 1, 0.8, 0.6, 0.3, 0.1, 0, 0.1, 0.3, 0.6, 0.8],
    [0.3, 0.6, 0.8, 1, 0.8, 0.6, 0.3, 0.1, 0, 0.1, 0.3, 0.6],
    [0.1, 0.3, 0.6, 0.8, 1, 0.8, 0.6, 0.3, 0.1, 0, 0.1, 0.3],
    [0, 0.1, 0.3, 0.6, 0.8, 1, 0.8, 0.6, 0.3, 0.1, 0, 0.1],
    [0.1, 0, 0.1, 0.3, 0.6, 0.8, 1, 0.8, 0.6, 0.3, 0.1, 0],
    [0.3, 0.1, 0, 0.1, 0.3, 0.6, 0.8, 1, 0.8, 0.6, 0.3, 0.1],
    [0.6, 0.3, 0.1, 0, 0.1, 0.3, 0.6, 0.8, 1, 0.8, 0.6, 0.3],
    [0.8, 0.6, 0.3, 0.1, 0, 0.1, 0.3, 0.6, 0.8, 1, 0.8, 0.6],
    [1, 0.8, 0.6, 0.3, 0.1, 0, 0.1, 0.3, 0.6, 0.8, 1, 0.8],
    [0.8, 1, 0.8, 0.6, 0.3, 0.1, 0, 0.1, 0.3, 0.6, 0.8, 1]
  ];

  // Normalize keys to 0-11 range
  const normalizedKey1 = key1 % 12;
  const normalizedKey2 = key2 % 12;

  return camelotWheel[normalizedKey1][normalizedKey2];
}

export const trackAnalysisService = {
  getAudioFeatures: async (trackId: string): Promise<AudioFeatures> => {
    const cached = audioFeaturesCache.get(trackId);
    if (cached) return cached;

    const features = await spotifyApi.getAudioFeatures(trackId);
    const analyzed = {
      bpm: features.tempo,
      key: features.key,
      mode: features.mode,
      timeSignature: features.time_signature,
      danceability: features.danceability,
      energy: features.energy,
      acousticness: features.acousticness,
      instrumentalness: features.instrumentalness,
      liveness: features.liveness,
      valence: features.valence
    };

    audioFeaturesCache.set(trackId, analyzed);
    return analyzed;
  },

  findSimilarTracks: async (trackId: string): Promise<string[]> => {
    const features = await trackAnalysisService.getAudioFeatures(trackId);
    const recommendations = await spotifyApi.getRecommendations({
      seed_tracks: [trackId],
      target_tempo: features.bpm,
      target_energy: features.energy,
      target_danceability: features.danceability
    });

    return recommendations.tracks.map(track => track.id);
  },

  analyzeMixability: async (track1Id: string, track2Id: string): Promise<{
    bpmDiff: number;
    keyCompatibility: number;
    energyTransition: number;
  }> => {
    const [track1, track2] = await Promise.all([
      trackAnalysisService.getAudioFeatures(track1Id),
      trackAnalysisService.getAudioFeatures(track2Id)
    ]);

    return {
      bpmDiff: Math.abs(track1.bpm - track2.bpm),
      keyCompatibility: calculateKeyCompatibility(track1.key, track2.key),
      energyTransition: track2.energy - track1.energy
    };
  }
}; 