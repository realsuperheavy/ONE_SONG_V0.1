export interface SpotifyTrack {
  id: string;
  title: string;
  artist: string;
  albumArt?: string;
  duration: number;
  previewUrl?: string;
  popularity: number;
  explicit: boolean;
} 