import { 
  QueueItem, 
  QueueOrderUpdate, 
  Song,
  QueueStatus,
  QueueError
} from '@/types/core';
import { QueueService } from '@/services/queue';
import { PlayerService } from '@/services/player';
import { AnalyticsService } from '@/services/analytics';
import { RealTimeService } from '@/services/realtime';
import { ErrorReporter } from '@/lib/errors/ErrorReporter';

interface QueueManagementConfig {
  autoPlayEnabled: boolean;
  minQueueLength?: number;
  genrePreferences?: string[];
  maxQueueSize?: number;
}

export class QueueManagementFlow {
  constructor(
    private readonly queueService: QueueService,
    private readonly playerService: PlayerService,
    private readonly analyticsService: AnalyticsService,
    private readonly realTimeService: RealTimeService,
    private readonly errorReporter: ErrorReporter,
    private config: QueueManagementConfig = {
      autoPlayEnabled: false,
      minQueueLength: 3,
      maxQueueSize: 100
    }
  ) {}

  async reorderQueue(eventId: string, updates: QueueOrderUpdate[]): Promise<void> {
    try {
      await this.queueService.validateReorderUpdates(updates);
      await this.queueService.applyReorderUpdates(eventId, updates);
      
      this.analyticsService.trackEvent('queue_reordered', {
        eventId,
        updateCount: updates.length
      });

      await this.realTimeService.notifyQueueUpdate(eventId);
    } catch (error) {
      this.errorReporter.report(new QueueError('Failed to reorder queue', error));
      throw error;
    }
  }

  async addToQueue(eventId: string, song: Song): Promise<void> {
    try {
      const currentQueue = await this.queueService.getQueue(eventId);
      
      if (currentQueue.length >= (this.config.maxQueueSize || 100)) {
        throw new QueueError('Queue is at maximum capacity');
      }

      await this.queueService.addSong(eventId, song);
      
      this.analyticsService.trackEvent('song_added_to_queue', {
        eventId,
        songId: song.id
      });

      await this.realTimeService.notifyQueueUpdate(eventId);
      
      if (this.config.autoPlayEnabled) {
        await this.checkAutoPlay(eventId);
      }
    } catch (error) {
      this.errorReporter.report(new QueueError('Failed to add song to queue', error));
      throw error;
    }
  }

  async removeFromQueue(eventId: string, queueItemId: string): Promise<void> {
    try {
      await this.queueService.removeSong(eventId, queueItemId);
      
      this.analyticsService.trackEvent('song_removed_from_queue', {
        eventId,
        queueItemId
      });

      await this.realTimeService.notifyQueueUpdate(eventId);
    } catch (error) {
      this.errorReporter.report(new QueueError('Failed to remove song from queue', error));
      throw error;
    }
  }

  private async checkAutoPlay(eventId: string): Promise<void> {
    try {
      const currentQueue = await this.queueService.getQueue(eventId);
      const currentlyPlaying = await this.playerService.getCurrentlyPlaying(eventId);

      if (!currentlyPlaying && currentQueue.length > 0) {
        const nextSong = currentQueue[0];
        await this.playerService.playSong(eventId, nextSong.song);
        await this.queueService.markAsPlaying(eventId, nextSong.id);
      }
    } catch (error) {
      this.errorReporter.report(new QueueError('AutoPlay check failed', error));
      // Don't throw here - autoplay failure shouldn't break the queue
    }
  }

  async getQueueStatus(eventId: string): Promise<QueueStatus> {
    try {
      const [queue, currentlyPlaying] = await Promise.all([
        this.queueService.getQueue(eventId),
        this.playerService.getCurrentlyPlaying(eventId)
      ]);

      return {
        items: queue,
        totalRequests: queue.length,
        currentPosition: currentlyPlaying ? queue.findIndex(item => item.id === currentlyPlaying.id) : -1
      };
    } catch (error) {
      this.errorReporter.report(new QueueError('Failed to get queue status', error));
      throw error;
    }
  }
} 