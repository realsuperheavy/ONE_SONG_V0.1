import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { Cache } from '@/lib/cache';
import { analyticsService } from '@/lib/firebase/services/analytics';
import { AppError } from '@/lib/error/AppError';
import { getSpotifyConfig } from '../config';

export class SpotifyAuthService {
  private api: SpotifyApi;
  private tokenCache: Cache<string>;

  constructor() {
    this.api = SpotifyApi.withClientCredentials(
      process.env.SPOTIFY_CLIENT_ID!,
      process.env.SPOTIFY_CLIENT_SECRET!
    );
    this.tokenCache = new Cache<string>({
      maxSize: 1000,
      ttl: 3000 // 50 minutes
    });
  }

  generateAuthUrl(userType: 'dj' | 'attendee'): string {
    const config = getSpotifyConfig();
    const scopes = userType === 'dj' ? config.scopes : ['user-read-email', 'streaming'];
    
    const params = new URLSearchParams({
      client_id: config.clientId,
      response_type: 'code',
      redirect_uri: config.redirectUri,
      scope: scopes.join(' '),
      state: userType, // Store user type in state parameter
      show_dialog: 'true'
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  async handleCallback(code: string, userId: string): Promise<void> {
    try {
      const config = getSpotifyConfig();
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: config.redirectUri
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get Spotify tokens');
      }

      const tokens = await response.json();
      
      // Get Spotify user profile
      const spotifyUser = await this.api.users.getMe(tokens.access_token);

      // Update Firebase auth custom claims
      await adminAuth.setCustomUserClaims(userId, {
        spotify: {
          id: spotifyUser.id,
          linked: true
        }
      });

      // Store tokens securely
      await adminDb.collection('users').doc(userId).collection('private').doc('spotify').set({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresIn: tokens.expires_in
      });
    } catch (error) {
      throw new AppError('Failed to handle Spotify callback', error);
    }
  }

  refreshAccessToken(refreshToken: string): Promise<string> {
    return this.api.token.refresh(refreshToken);
  }
} 