import { useCallback } from 'react';
import { QueueManager } from '@/lib/queue/QueueManager';
import { useToast } from '@/hooks/useToast';
import { analyticsService } from '@/lib/firebase/services/analytics';
import type { SongRequest } from '@/types/models';

export function useQueueManager(eventId: string) {
  const { showToast } = useToast();
  const queueManager = new QueueManager(eventId);

  const addToQueue = useCallback(async (request: Omit<SongRequest, 'id'>) => {
    try {
      const requestId = await queueManager.addToQueue(request);
      analyticsService.trackEvent('request_added', {
        eventId,
        requestId
      });
      return requestId;
    } catch (error) {
      analyticsService.trackError(error as Error, {
        context: 'add_to_queue',
        eventId
      });
      throw error;
    }
  }, [eventId, queueManager]);

  const voteForRequest = useCallback(async (requestId: string, userId: string) => {
    try {
      await queueManager.voteForRequest(requestId, userId);
      showToast({
        title: "Success",
        description: "Vote submitted successfully",
        variant: "default"
      });
    } catch (error) {
      showToast({
        title: "Error",
        description: "Failed to submit vote",
        variant: "destructive"
      });
      analyticsService.trackError(error as Error, {
        context: 'vote_for_request',
        eventId,
        requestId,
        userId
      });
    }
  }, [eventId, showToast]);

  return { addToQueue, voteForRequest };
} 