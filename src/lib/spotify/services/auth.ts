import { TokenStorage } from './token-storage';
import { getSpotifyConfig } from '../config';
import { analytics } from '@/lib/firebase/config';
import { logEvent } from '@firebase/analytics';

interface SpotifyTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export const spotifyAuthService = {
  generateAuthUrl: (): string => {
    const config = getSpotifyConfig();
    const params = new URLSearchParams({
      client_id: config.clientId,
      response_type: 'code',
      redirect_uri: config.redirectUri,
      scope: config.scopes.join(' '),
      show_dialog: 'true'
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  },

  handleCallback: async (code: string): Promise<SpotifyTokens> => {
    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: window.location.origin + '/auth/spotify/callback',
          client_id: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get Spotify tokens');
      }

      const data = await response.json();
      const tokens: SpotifyTokens = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in
      };

      TokenStorage.storeTokens({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: Date.now() + tokens.expiresIn * 1000
      });

      if (analytics) {
        logEvent(analytics, 'spotify_auth_success', {
          timestamp: Date.now()
        });
      }

      return tokens;
    } catch (error) {
      if (analytics) {
        logEvent(analytics, 'spotify_auth_error', {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now()
        });
      }
      throw error;
    }
  },

  refreshAccessToken: async (): Promise<string> => {
    const tokens = TokenStorage.getTokens();
    if (!tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: tokens.refreshToken,
          client_id: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!
        })
      });

      if (!response.ok) {
        TokenStorage.clearTokens();
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      
      TokenStorage.storeTokens({
        accessToken: data.access_token,
        refreshToken: tokens.refreshToken,
        expiresAt: Date.now() + data.expires_in * 1000
      });

      return data.access_token;
    } catch (error) {
      TokenStorage.clearTokens();
      throw error;
    }
  },

  getStoredTokens: (): StoredTokens | null => {
    return TokenStorage.getTokens();
  },

  isAuthenticated: (): boolean => {
    return TokenStorage.isTokenValid();
  },

  logout: (): void => {
    TokenStorage.clearTokens();
  }
}; 