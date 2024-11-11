import type { SpotifyTrack } from '@/types/models';

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

interface SpotifyError {
  error: {
    status: number;
    message: string;
  };
}

export class SpotifyService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private refreshToken: string | null = null;
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor() {
    this.clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!;
    this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
  }

  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(
            `${this.clientId}:${this.clientSecret}`
          ).toString('base64')}`,
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
        }),
      });

      const data = await response.json() as SpotifyTokenResponse;
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + data.expires_in * 1000;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.accessToken || Date.now() >= this.tokenExpiry) {
      await this.refreshAccessToken();
    }

    const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      const error = (await response.json()) as SpotifyError;
      throw new Error(`Spotify API Error: ${error.error.message}`);
    }

    return response.json() as Promise<T>;
  }

  async searchTracks(query: string): Promise<SpotifyTrack[]> {
    try {
      const data = await this.request<{
        tracks: { items: any[] };
      }>(`/search?q=${encodeURIComponent(query)}&type=track&limit=10`);

      return data.tracks.items.map((track) => ({
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
    } catch (error) {
      console.error('Search tracks failed:', error);
      throw error;
    }
  }

  async getTrackDetails(trackId: string): Promise<SpotifyTrack> {
    try {
      const track = await this.request<any>(`/tracks/${trackId}`);
      return {
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
      };
    } catch (error) {
      console.error('Get track details failed:', error);
      throw error;
    }
  }

  async getRecommendations(seedTracks: string[]): Promise<SpotifyTrack[]> {
    try {
      const data = await this.request<{ tracks: any[] }>(
        `/recommendations?seed_tracks=${seedTracks.join(',')}&limit=5`
      );

      return data.tracks.map((track) => ({
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
    } catch (error) {
      console.error('Get recommendations failed:', error);
      throw error;
    }
  }

  async createPlaylist(
    userId: string,
    name: string,
    description?: string
  ): Promise<string> {
    try {
      const response = await this.request<{ id: string }>(
        `/users/${userId}/playlists`,
        {
          method: 'POST',
          body: JSON.stringify({
            name,
            description,
            public: false
          })
        }
      );
      return response.id;
    } catch (error) {
      console.error('Create playlist failed:', error);
      throw error;
    }
  }

  async addTracksToPlaylist(
    playlistId: string,
    trackUris: string[]
  ): Promise<void> {
    try {
      await this.request(`/playlists/${playlistId}/tracks`, {
        method: 'POST',
        body: JSON.stringify({
          uris: trackUris
        })
      });
    } catch (error) {
      console.error('Add tracks to playlist failed:', error);
      throw error;
    }
  }

  setAccessToken(token: string, expiresIn: number): void {
    this.accessToken = token;
    this.tokenExpiry = Date.now() + expiresIn * 1000;
  }

  setRefreshToken(token: string): void {
    this.refreshToken = token;
  }

  isAuthenticated(): boolean {
    return !!this.accessToken && Date.now() < this.tokenExpiry;
  }
}

export const spotifyService = new SpotifyService();