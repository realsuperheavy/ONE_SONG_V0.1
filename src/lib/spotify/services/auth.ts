import { getSpotifyConfig, SpotifyConfig } from '../config';

interface SpotifyTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export const spotifyAuthService = {
  generateAuthUrl: (userType: 'dj' | 'attendee'): string => {
    const config = getSpotifyConfig(userType);
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
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in
    };
  },

  refreshAccessToken: async (refreshToken: string): Promise<string> => {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!
      })
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    return data.access_token;
  }
}; 