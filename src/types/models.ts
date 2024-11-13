import { Timestamp } from 'firebase-admin/firestore';

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ id: string; name: string }>;
  album: {
    id: string;
    name: string;
    images: Array<{ url: string; height: number; width: number }>;
  };
  duration_ms: number;
  preview_url: string | null;
}

export interface SongRequest {
  id: string;
  eventId: string;
  userId: string;
  song: {
    title: string;
    artist: string;
    albumArt?: string;
    duration?: number;
  };
  status: 'pending' | 'approved' | 'rejected' | 'played';
  metadata: {
    requestTime: number;
    message?: string;
    votes: number;
  };
}

export interface QueueItem extends SongRequest {
  queuePosition: number;
  addedAt: string;
}

export interface Event {
  id: string;
  name: string;
  details: {
    name: string;
    description?: string;
  };
  djId: string;
  status: 'active' | 'ended' | 'paused';
  stats: {
    attendeeCount: number;
    requestCount: number;
    totalTips: number;
  };
  settings: {
    allowTips: boolean;
    requireApproval: boolean;
    maxQueueSize: number;
    blacklistedGenres: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface Request {
  // Define your request properties here
  id: string;
  // Add other required properties
}

export interface User {
  id: string;
  email: string;
  displayName?: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  notifications: boolean;
  language: string;
  emailNotifications: boolean;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  role: 'dj' | 'attendee';
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
    language: string;
    emailNotifications: boolean;
    updatedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface EventAnalytics {
  totalRequests: number;
  queueSize: number;
  activeUsers: number;
  averageWaitTime: number;
  topGenres: Array<{
    name: string;
    count: number;
  }>;
  requestTrends: Array<{
    timestamp: Date;
    count: number;
  }>;
}

// Admin Operations Types
export interface AdminOperations {
  // User Management
  createUser: (userData: Partial<UserProfile>) => Promise<string>;
  updateUser: (userId: string, updates: Partial<UserProfile>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  
  // Event Management
  createEvent: (eventData: Partial<Event>) => Promise<string>;
  updateEvent: (eventId: string, updates: Partial<Event>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  
  // Request Management
  approveRequest: (eventId: string, requestId: string) => Promise<void>;
  rejectRequest: (eventId: string, requestId: string) => Promise<void>;
  
  // Attendee Management
  manageAttendee: (eventId: string, userId: string, action: AttendeeAction) => Promise<void>;
}

// Rate Limiting Types
export interface RateLimit {
  userId: string;
  resourceType: 'request' | 'search' | 'attendee';
  count: number;
  window: {
    start: Timestamp;
    end: Timestamp;
  };
  limit: number;
}

export interface RateLimitConfig {
  request: {
    limit: number;
    windowSeconds: number;
  };
  search: {
    limit: number;
    windowSeconds: number;
  };
  attendee: {
    limit: number;
    windowSeconds: number;
  };
  subscription: {
    limit: number;
    windowSeconds: number;
  };
}

// Attendee Management Types
export interface AttendeeManagement {
  status: 'active' | 'inactive' | 'banned';
  joinedAt: Date;
  lastActive: Date;
  permissions: {
    canRequest: boolean;
    canVote: boolean;
    canChat: boolean;
  };
  metadata: {
    browser: string;
    platform: string;
    ip: string;
  };
}

export type AttendeeAction = 
  | { type: 'JOIN'; metadata: Pick<AttendeeManagement, 'metadata'> }
  | { type: 'UPDATE_STATUS'; status: AttendeeManagement['status'] }
  | { type: 'UPDATE_PERMISSIONS'; permissions: Partial<AttendeeManagement['permissions']> }
  | { type: 'BAN' }
  | { type: 'REMOVE' };

// Error Types
export interface AppError extends Error {
  code: ErrorCode;
  context?: Record<string, unknown>;
  timestamp: Date;
  handled: boolean;
}

export type ErrorCode = 
  | 'RATE_LIMIT_EXCEEDED'
  | 'INVALID_REQUEST'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'OPERATION_FAILED';

export interface ErrorContext {
  userId?: string;
  eventId?: string;
  requestId?: string;
  action?: string;
  metadata?: Record<string, unknown>;
} 