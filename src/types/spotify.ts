export interface SpotifyApiTrack {
  id: string;
  name: string;
  artists: Array<{
    id: string;
    name: string;
  }>;
  album: {
    id: string;
    name: string;
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
  };
  duration_ms: number;
  preview_url: string | null;
}

export interface SpotifySearchResponse {
  tracks: {
    items: SpotifyApiTrack[];
    total: number;
    limit: number;
    offset: number;
  };
} 