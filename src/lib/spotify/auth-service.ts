import { spotifyApi } from './config';
import { analyticsService } from '@/lib/firebase/services/analytics';

export class SpotifyAuthService {
  private static clientCredentialsToken: string | null = null;
  private static tokenExpiry: number | null = null;

  static async getClientCredentialsToken(): Promise<string> {
    try {
      // Check if we have a valid token
      if (
        this.clientCredentialsToken && 
        this.tokenExpiry && 
        Date.now() < this.tokenExpiry
      ) {
        return this.clientCredentialsToken;
      }

      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(
            `${process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
          ).toString('base64')}`,
        },
        body: 'grant_type=client_credentials',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error_description || 'Failed to get access token');
      }

      const data = await response.json();
      
      if (!data.access_token) {
        throw new Error('No access token received');
      }

      this.clientCredentialsToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000);

      analyticsService.trackEvent('spotify_token_refreshed', {
        success: true,
        expiresIn: data.expires_in
      });

      return data.access_token;
    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'spotify_auth',
        action: 'get_client_credentials'
      });
      throw error;
    }
  }

  static async initializeApi(): Promise<void> {
    try {
      const token = await this.getClientCredentialsToken();
      spotifyApi.setAccessToken(token);
      
      analyticsService.trackEvent('spotify_api_initialized', {
        success: true
      });
    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'spotify_auth',
        action: 'initialize_api'
      });
      throw error;
    }
  }

  static async refreshTokenIfNeeded(): Promise<void> {
    try {
      if (
        !this.tokenExpiry ||
        Date.now() >= this.tokenExpiry - 300000 // Refresh if less than 5 minutes remaining
      ) {
        await this.getClientCredentialsToken();
        analyticsService.trackEvent('spotify_token_refreshed', {
          success: true,
          automatic: true
        });
      }
    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'spotify_auth',
        action: 'refresh_token'
      });
      throw new Error('Failed to refresh Spotify token');
    }
  }

  static async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.ok;
    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'spotify_auth',
        action: 'validate_token'
      });
      return false;
    }
  }
} 