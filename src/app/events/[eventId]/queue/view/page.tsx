'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useEventStore } from '@/store/event';
import { useQueueStore } from '@/store/queue';
import { QueueItem } from '@/components/queue/QueueItem';
import { eventService } from '@/lib/firebase/services/event';
import { queueService } from '@/lib/firebase/services/queue';

export default function ViewQueuePage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const user = useAuthStore((state) => state.user);
  const { currentEvent, setCurrentEvent } = useEventStore();
  const { queue, setQueue, loading, error } = useQueueStore();

  useEffect(() => {
    if (!eventId) return;

    const eventUnsubscribe = eventService.subscribeToEvent(eventId, (event) => {
      setCurrentEvent(event);
    });

    const queueUnsubscribe = queueService.subscribeToQueue(eventId, (updatedQueue) => {
      setQueue(updatedQueue);
    });

    return () => {
      eventUnsubscribe();
      queueUnsubscribe();
    };
  }, [eventId, setCurrentEvent, setQueue]);

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Please sign in to view the queue.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Loading queue...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!currentEvent) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Event not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Queue - {currentEvent.details.name}
        </h1>
        <p className="text-gray-600">
          Current song queue for this event
        </p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Up Next</h2>
              <span className="text-sm text-gray-500">
                {queue.length} songs in queue
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {queue.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No songs in queue
              </p>
            ) : (
              queue.map((item) => (
                <QueueItem
                  key={item.id}
                  item={item}
                  eventId={eventId}
                  isDragging={false}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 