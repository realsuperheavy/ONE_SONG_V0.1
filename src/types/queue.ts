import { Timestamp } from 'firebase/firestore';

export interface QueueItem {
  id: string;
  eventId: string;
  songId: string;
  requestId: string;
  position: number;
  addedAt: Timestamp;
  playedAt?: Timestamp;
  status: 'pending' | 'playing' | 'played' | 'skipped';
  queuePosition: number;
  song: {
    id: string;
    title: string;
    artist: string;
    duration: number;
  };
  metadata?: {
    message?: string;
    votes?: number;
    tipAmount?: number;
  };
} 