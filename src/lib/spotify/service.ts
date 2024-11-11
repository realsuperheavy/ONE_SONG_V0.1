import type { SpotifyTrack } from '@/types/models';

export class SpotifyService {
  accessToken: string | null = null;

  async searchTracks(query: string): Promise<SpotifyTrack[]> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`
      }
    });

    const data = await response.json();
    return data.tracks.items.map((track: any) => ({
      id: track.id,
      name: track.name,
      artists: track.artists.map((artist: any) => ({
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

export const spotifyService = new SpotifyService(); 