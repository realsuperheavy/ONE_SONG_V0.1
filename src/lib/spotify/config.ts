export const SPOTIFY_API_BASE_URL = 'https://api.spotify.com/v1';

export const SPOTIFY_SCOPES = {
  dj: [
    'playlist-read-private',
    'playlist-modify-public',
    'playlist-modify-private',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing'
  ],
  attendee: [
    'user-read-playback-state',
    'user-read-currently-playing'
  ]
};

export interface SpotifyConfig {
  clientId: string;
  redirectUri: string;
  scopes: string[];
}

export const getSpotifyConfig = (userType: 'dj' | 'attendee'): SpotifyConfig => ({
  clientId: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || '',
  redirectUri: `${window.location.origin}/auth/spotify/callback`,
  scopes: SPOTIFY_SCOPES[userType]
}); 