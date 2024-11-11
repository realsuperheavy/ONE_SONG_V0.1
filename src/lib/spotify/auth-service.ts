import { adminAuth, adminDb } from '../firebase/admin';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { AppError } from '@/lib/error/AppError';
import { analyticsService } from '../firebase/services/analytics';
import { Cache } from '@/lib/cache';
import type { UserProfile } from '@/types/models';

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
      ttl: 3000 // 50 minutes (Spotify tokens last 60 minutes)
    });
  }

  async linkAccount(userId: string, spotifyCode: string): Promise<void> {
    try {
      // Exchange code for tokens
      const tokens = await this.api.authorizationCodeGrant(spotifyCode);
      
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
        expiresAt: Date.now() + tokens.expires_in * 1000,
        scope: tokens.scope
      });

      // Cache access token
      await this.tokenCache.set(userId, tokens.access_token);

      analyticsService.trackEvent('spotify_account_linked', {
        userId,
        spotifyId: spotifyUser.id
      });
    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'spotify_link_account',
        userId
      });
      throw new AppError({
        code: 'OPERATION_FAILED',
        message: 'Failed to link Spotify account',
        context: { userId, error: (error as Error).message }
      });
    }
  }

  async unlinkAccount(userId: string): Promise<void> {
    try {
      // Remove Spotify claims
      await adminAuth.setCustomUserClaims(userId, {
        spotify: null
      });

      // Delete stored tokens
      await adminDb
        .collection('users')
        .doc(userId)
        .collection('private')
        .doc('spotify')
        .delete();

      // Remove from cache
      await this.tokenCache.delete(userId);

      analyticsService.trackEvent('spotify_account_unlinked', { userId });
    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'spotify_unlink_account',
        userId
      });
      throw new AppError({
        code: 'OPERATION_FAILED',
        message: 'Failed to unlink Spotify account',
        context: { userId, error: (error as Error).message }
      });
    }
  }

  async refreshAccessToken(userId: string): Promise<string> {
    try {
      const tokenDoc = await adminDb
        .collection('users')
        .doc(userId)
        .collection('private')
        .doc('spotify')
        .get();

      if (!tokenDoc.exists) {
        throw new AppError({
          code: 'NOT_FOUND',
          message: 'No Spotify tokens found',
          context: { userId }
        });
      }

      const { refreshToken } = tokenDoc.data()!;
      const tokens = await this.api.refreshAccessToken(refreshToken);

      // Update stored tokens
      await tokenDoc.ref.update({
        accessToken: tokens.access_token,
        expiresAt: Date.now() + tokens.expires_in * 1000
      });

      // Update cache
      await this.tokenCache.set(userId, tokens.access_token);

      return tokens.access_token;
    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'spotify_refresh_token',
        userId
      });
      throw error;
    }
  }

  async getValidAccessToken(userId: string): Promise<string> {
    // Try cache first
    const cachedToken = await this.tokenCache.get(userId);
    if (cachedToken) return cachedToken;

    // Get stored tokens
    const tokenDoc = await adminDb
      .collection('users')
      .doc(userId)
      .collection('private')
      .doc('spotify')
      .get();

    if (!tokenDoc.exists) {
      throw new AppError({
        code: 'NOT_FOUND',
        message: 'No Spotify tokens found',
        context: { userId }
      });
    }

    const { accessToken, expiresAt } = tokenDoc.data()!;

    // Check if token needs refresh
    if (Date.now() >= expiresAt - 60000) { // Refresh if less than 1 minute left
      return this.refreshAccessToken(userId);
    }

    // Cache and return valid token
    await this.tokenCache.set(userId, accessToken);
    return accessToken;
  }
}

export const spotifyAuthService = new SpotifyAuthService(); 