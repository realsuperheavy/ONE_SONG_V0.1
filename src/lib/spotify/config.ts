import { getApp } from 'firebase/app';

interface SpotifyConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

const spotifyConfig: SpotifyConfig = {
  clientId: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
  redirectUri: `${process.env.NEXT_PUBLIC_API_URL}/auth/spotify/callback`,
  scopes: [
    'user-read-private',
    'user-read-email',
    'playlist-read-private',
    'playlist-modify-public',
    'playlist-modify-private',
    'streaming',
    'user-read-playback-state',
    'user-modify-playback-state'
  ]
};

export const getSpotifyAuthUrl = (): string => {
  const params = new URLSearchParams({
    client_id: spotifyConfig.clientId,
    response_type: 'code',
    redirect_uri: spotifyConfig.redirectUri,
    scope: spotifyConfig.scopes.join(' '),
    show_dialog: 'true'
  });

  return `https://accounts.spotify.com/authorize?${params.toString()}`;
};

export const getSpotifyConfig = (): SpotifyConfig => {
  if (!spotifyConfig.clientId || !spotifyConfig.clientSecret) {
    throw new Error('Spotify configuration is missing required values');
  }
  return spotifyConfig;
}; 