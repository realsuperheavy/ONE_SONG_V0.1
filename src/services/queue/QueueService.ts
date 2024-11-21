import { QueueItem, QueueOrderUpdate, Song } from '@/types/core';

export interface QueueService {
  getQueue(eventId: string): Promise<QueueItem[]>;
  addSong(eventId: string, song: Song): Promise<void>;
  removeSong(eventId: string, queueItemId: string): Promise<void>;
  validateReorderUpdates(updates: QueueOrderUpdate[]): Promise<void>;
  applyReorderUpdates(eventId: string, updates: QueueOrderUpdate[]): Promise<void>;
  markAsPlaying(eventId: string, queueItemId: string): Promise<void>;
}

export interface PlayerService {
  getCurrentlyPlaying(eventId: string): Promise<QueueItem | null>;
  playSong(eventId: string, song: Song): Promise<void>;
  stopPlayback(eventId: string): Promise<void>;
}

export interface RealTimeService {
  notifyQueueUpdate(eventId: string): Promise<void>;
  subscribeToQueueUpdates(eventId: string, callback: (queue: QueueItem[]) => void): () => void;
} 