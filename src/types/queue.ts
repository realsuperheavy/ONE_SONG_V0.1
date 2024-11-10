import { SongRequest } from './models';

export interface QueueItem extends SongRequest {
  id: string;
  // ... other properties ...
} 