import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { adminDb } from '../firebase/admin';
import { Cache } from '@/lib/cache';

export class SpotifyAuthService {
  private tokenCache: Cache;

  constructor(private readonly db = adminDb) {
    this.tokenCache = new Cache('spotify_tokens');
  }

  async getOrRefreshToken(userId: string): Promise<string> {
    const cachedToken = await this.tokenCache.get(`token_${userId}`);
    if (cachedToken) return cachedToken;

    const userDoc = await this.db.collection('users').doc(userId).get();
    const spotifyToken = userDoc.data()?.spotifyToken;

    if (!spotifyToken) {
      throw new Error('User not connected to Spotify');
    }

    try {
      const api = SpotifyApi.withAccessToken(
        process.env.SPOTIFY_CLIENT_ID!,
        spotifyToken
      );
      
      // Verify token validity
      await api.tracks.get('dummy');
      await this.tokenCache.set(`token_${userId}`, spotifyToken, 3600); // 1 hour
      return spotifyToken;
    } catch (error) {
      // Token expired, refresh it
      return this.refreshToken(userId, userDoc.data()?.spotifyRefreshToken);
    }
  }

  private async refreshToken(userId: string, refreshToken?: string): Promise<string> {
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    const data = await response.json();
    
    // Update token in database and cache
    await Promise.all([
      this.db.collection('users').doc(userId).update({
        spotifyToken: data.access_token,
        tokenExpiry: new Date(Date.now() + data.expires_in * 1000),
      }),
      this.tokenCache.set(`token_${userId}`, data.access_token, data.expires_in)
    ]);

    return data.access_token;
  }
} 