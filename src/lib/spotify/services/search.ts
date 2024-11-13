import type { SpotifySearchResponse, SpotifyApiTrack } from '@/types/spotify';
import { SPOTIFY_API_URL, getClientCredentialsToken } from '../config';

export const spotifyService = {
  search: async (query: string): Promise<SpotifyApiTrack[]> => {
    const token = await getClientCredentialsToken();
    const response = await fetch(
      `${SPOTIFY_API_URL}/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const data = await response.json() as SpotifySearchResponse;
    return data.tracks.items;
  }
}; 