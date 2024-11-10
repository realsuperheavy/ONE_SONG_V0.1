import { useEffect, useState } from 'react';
import { eventService } from '@/lib/firebase/services/event';
import { queueService, QueueItem } from '@/lib/firebase/services/queue';
import { Event } from '@/types/models';
import { Request } from '@/types/models';

interface EventData {
  event: Event | null;
  requests: Request[];
  queue: QueueItem[];
  isLoading: boolean;
  error: string | null;
  updateEvent: (updatedEvent: Event) => void;
}

export function useEventData(eventId: string): EventData {
  const [data, setData] = useState<EventData>({
    event: null,
    requests: [],
    queue: [],
    isLoading: true,
    error: null,
    updateEvent: async (updatedEvent: Event) => {
      try {
        await eventService.updateEvent(updatedEvent.id, updatedEvent);
        setData(prev => ({ ...prev, event: updatedEvent }));
      } catch (error) {
        console.error('Failed to update event:', error);
        throw error;
      }
    }
  });

  useEffect(() => {
    if (!eventId) return;

    const eventUnsubscribe = eventService.subscribeToEvent(eventId, (event) => {
      setData(prev => ({ ...prev, event, isLoading: false }));
    });

    const queueUnsubscribe = queueService.subscribeToQueue(eventId, (queue) => {
      setData(prev => ({ ...prev, queue }));
    });

    return () => {
      eventUnsubscribe();
      queueUnsubscribe();
    };
  }, [eventId]);

  return data;
} 