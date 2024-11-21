// Core component types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Analytics types
export interface AnalyticsData {
  requestsByHour: {
    hour: number;
    count: number;
  }[];
  genreDistribution: {
    genre: string;
    count: number;
  }[];
  totalRequests: number;
  uniqueUsers: number;
}

// Track and Request types
export interface Track {
  id: string;
  title: string;
  artist: string;
  albumArt?: string;
  duration: number;
  previewUrl?: string;
  metadata: {
    spotifyId?: string;
    genre?: string[];
  };
}

export interface SongRequest {
  id: string;
  track: Track;
  status: 'pending' | 'approved' | 'rejected' | 'played';
  metadata: {
    requestTime: number;
    votes: number;
    tip?: {
      amount: number;
      currency: string;
    };
  };
} 