export { spotifyAuthService } from './auth';
export { spotifyTrackService } from './track';
export { spotifyApi, SpotifyApiError } from './api';

const spotifyService = {
  auth: spotifyAuthService,
  track: spotifyTrackService
};

export default spotifyService; 