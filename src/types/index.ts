export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    images: Array<{ url: string }>;
  };
  duration_ms: number;
  preview_url?: string;
}

export interface SongRequest {
  id: string;
  eventId: string;
  userId: string;
  song: {
    id: string;
    title: string;
    artist: string;
    albumArt?: string;
    previewUrl?: string;
    duration: number;
  };
  status: 'pending' | 'approved' | 'rejected' | 'played';
  metadata: {
    requestTime: number;
    votes: number;
  };
}

export interface CurrentTrack {
  id: string;
  title: string;
  artist: string;
  albumArt?: string;
  duration: number;
}

export interface EventDetails {
  name: string;
  description: string;
}

export interface Event {
  details: EventDetails;
  // Add other event properties as needed
} 