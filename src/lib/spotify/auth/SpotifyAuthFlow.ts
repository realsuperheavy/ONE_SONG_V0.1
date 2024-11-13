import { spotifyApi } from '../config';
import { analyticsService } from '@/lib/firebase/services/analytics';
import { PerformanceMonitor } from '@/lib/monitoring/PerformanceMonitor';

export class SpotifyAuthFlow {
  private static clientCredentialsToken: string | null = null;
  private static tokenExpiry: number | null = null;
  private static performanceMonitor = PerformanceMonitor.getInstance();

  static async getClientCredentialsToken(): Promise<string> {
    this.performanceMonitor.startOperation('getSpotifyToken');
    try {
      // Check if we have a valid token
      if (
        this.clientCredentialsToken && 
        this.tokenExpiry && 
        Date.now() < this.tokenExpiry
      ) {
        this.performanceMonitor.endOperation('getSpotifyToken');
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
      this.clientCredentialsToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000);

      this.performanceMonitor.endOperation('getSpotifyToken');
      analyticsService.trackEvent('spotify_token_refreshed', {
        success: true,
        duration: this.performanceMonitor.getMetrics().responseTime
      });

      return this.clientCredentialsToken;
    } catch (error) {
      this.performanceMonitor.trackError('getSpotifyToken');
      analyticsService.trackError(error as Error, {
        context: 'spotify_auth',
        action: 'get_client_credentials'
      });
      throw error;
    }
  }

  static async initializeApi(): Promise<void> {
    this.performanceMonitor.startOperation('initializeSpotifyApi');
    try {
      const token = await this.getClientCredentialsToken();
      spotifyApi.setAccessToken(token);
      
      this.performanceMonitor.endOperation('initializeSpotifyApi');
      analyticsService.trackEvent('spotify_api_initialized', {
        success: true,
        duration: this.performanceMonitor.getMetrics().responseTime
      });
    } catch (error) {
      this.performanceMonitor.trackError('initializeSpotifyApi');
      analyticsService.trackError(error as Error, {
        context: 'spotify_auth',
        action: 'initialize_api'
      });
      throw error;
    }
  }
} 