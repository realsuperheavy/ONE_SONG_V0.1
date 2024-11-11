export interface SpotifyTrack {
  id: string;
  name: string;
  artists: {
    id: string;
    name: string;
  }[];
  album: {
    id: string;
    name: string;
    images: {
      url: string;
      height: number;
      width: number;
    }[];
  };
  duration_ms: number;
  uri: string;
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
    tipAmount?: number;
  };
}

export interface Event {
  id: string;
  name: string;
  djId: string;
  status: 'active' | 'ended' | 'cancelled' | 'scheduled';
  settings: {
    allowTips: boolean;
    requireApproval: boolean;
    maxQueueSize: number;
    blacklistedGenres: string[];
  };
  stats: {
    attendeeCount: number;
    requestCount: number;
    totalTips: number;
  };
  createdAt: string;
  updatedAt: string;
  details: {
    name: string;
    status: string;
  };
}

export interface Request {
  // Define your request properties here
  id: string;
  // Add other required properties
}

export interface User {
  id: string;
  email: string;
  type: string;
  profile: {
    displayName: string;
    email: string;
    photoURL: string | null;
  };
  settings: {
    theme: string;
    notifications: boolean;
    language: string;
  };
  stats: {
    eventsCreated: number;
    requestsMade: number;
    tipsGiven: number;
  };
  createdAt: string;
} 