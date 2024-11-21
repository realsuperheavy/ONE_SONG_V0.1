// Event Types
export interface Event {
  id: string;
  name: string;
  settings: EventSettings;
  currentSong?: Song;
  queueLength: number;
}

export interface EventSettings {
  requiresAuth: boolean;
  autoPlayEnabled: boolean;
  tippingEnabled: boolean;
  moderationEnabled: boolean;
}

// Queue Types
export interface QueueItem {
  id: string;
  trackId: string;
  requestId?: string;
  userId: string;
  timestamp: number;
  position: number;
}

export interface QueueOrderUpdate {
  id: string;
  newPosition: number;
}

export interface QueueStatus {
  items: QueueItem[];
  totalRequests: number;
  currentPosition: number;
}

// Song Types
export interface Song {
  id: string;
  title: string;
  artist: string;
  duration: number;
  previewUrl?: string;
  albumArt?: string;
}

// Request Types
export interface SongRequest {
  id: string;
  trackId: string;
  userId: string;
  status: RequestStatus;
  metadata: RequestMetadata;
}

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'played';

export interface RequestMetadata {
  requestTime: number;
  votes: number;
  tip?: {
    amount: number;
    currency: string;
  };
}

// Service Types
export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export interface NearbyEvent extends Event {
  distance: number;
}

// Analytics Types
export interface AnalyticsEvent {
  name: string;
  properties: Record<string, any>;
  timestamp: number;
}

// Error Types
export class EventAccessError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'EventAccessError';
  }
} 