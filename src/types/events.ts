import type { Timestamp } from 'firebase-admin/firestore';

export interface EventSettings {
  allowTips: boolean;
  requireApproval: boolean;
  maxQueueSize: number;
  blacklistedGenres: string[];
}

export interface EventStats {
  attendeeCount: number;
  requestCount: number;
  totalTips: number;
  peakAttendees?: number;
  totalPlayTime?: number;
}

export interface EventMetadata {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  startedAt?: Timestamp;
  endedAt?: Timestamp;
}

export interface EventDetails {
  name: string;
  description?: string;
  venue?: string;
  coverImage?: string;
}

export type EventStatus = 'scheduled' | 'active' | 'ended' | 'cancelled';

export interface Event {
  id: string;
  djId: string;
  status: EventStatus;
  settings: EventSettings;
  stats: EventStats;
  metadata: EventMetadata;
  details: EventDetails;
}

export interface QueueItem {
  id: string;
  eventId: string;
  songId: string;
  requestId: string;
  position: number;
  addedAt: Timestamp;
  playedAt?: Timestamp;
  status: 'pending' | 'playing' | 'played' | 'skipped';
}

export interface QueueUpdateEvent {
  type: 'added' | 'removed' | 'reordered' | 'statusChanged';
  queueItem: QueueItem;
  previousPosition?: number;
} 