import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { adminDb, adminAuth } from '../../firebase/admin';
import { Cache } from '@/lib/cache';
import { analyticsService } from '../../firebase/services/analytics';
import { AppError } from '@/lib/error/AppError';
import type { UserProfile } from '@/types/models';

export class SpotifyAuthService {
  private tokenCache: Cache;
  private api: SpotifyApi;

  constructor(private readonly db = adminDb) {
    this.tokenCache = new Cache('spotify_tokens');
    this.api = SpotifyApi.withClientCredentials(
      process.env.SPOTIFY_CLIENT_ID!,
      process.env.SPOTIFY_CLIENT_SECRET!
    );
  }

  async linkPhoneNumber(userId: string, phoneNumber: string): Promise<void> {
    try {
      const userRecord = await adminAuth.getUserByPhoneNumber(phoneNumber);
      
      // Update Spotify claims for the phone user
      await adminAuth.setCustomUserClaims(userRecord.uid, {
        spotify: {
          linked: true,
          linkedUserId: userId
        }
      });

      analyticsService.trackEvent('spotify_phone_linked', {
        userId,
        phoneUserId: userRecord.uid
      });
    } catch (error) {
      analyticsService.trackError(error, {
        context: 'spotify_phone_link',
        userId,
        phoneNumber: phoneNumber.slice(-4)
      });
      throw new AppError({
        code: 'LINK_FAILED',
        message: 'Failed to link phone number to Spotify account',
        context: { userId, phoneNumber: phoneNumber.slice(-4) }
      });
    }
  }

  async revokeAccess(userId: string): Promise<void> {
    try {
      // Remove Spotify claims
      await adminAuth.setCustomUserClaims(userId, {
        spotify: null
      });

      // Remove stored tokens
      await this.db.collection('users')
        .doc(userId)
        .collection('private')
        .doc('spotify')
        .delete();

      // Clear from cache
      await this.tokenCache.delete(`token_${userId}`);

      analyticsService.trackEvent('spotify_access_revoked', { userId });
    } catch (error) {
      analyticsService.trackError(error, {
        context: 'spotify_revoke_access',
        userId
      });
      throw new AppError({
        code: 'REVOKE_FAILED',
        message: 'Failed to revoke Spotify access',
        context: { userId }
      });
    }
  }

  // Reuse existing token management methods
  getOrRefreshToken = this.getValidAccessToken;
  refreshToken = this.refreshAccessToken;
}

// Export singleton instance
export const spotifyAuthService = new SpotifyAuthService(); 