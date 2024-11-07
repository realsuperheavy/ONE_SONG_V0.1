'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useEventStore } from '@/store/event';
import { useQueueStore } from '@/store/queue';
import { QueueManager } from '@/components/queue/QueueManager';
import { eventService } from '@/lib/firebase/services/event';

export default function QueuePage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const user = useAuthStore((state) => state.user);
  const { currentEvent, setCurrentEvent } = useEventStore();
  const { loading, error } = useQueueStore();

  useEffect(() => {
    if (!eventId) return;

    const unsubscribe = eventService.subscribeToEvent(eventId, (event) => {
      setCurrentEvent(event);
    });

    return () => unsubscribe();
  }, [eventId, setCurrentEvent]);

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
          Queue Management - {currentEvent.details.name}
        </h1>
        <p className="text-gray-600">
          Manage your song queue and control the flow of music
        </p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold">Current Queue</h2>
              <p className="text-sm text-gray-500">
                Drag and drop songs to reorder
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Event Status: {currentEvent.status}
              </span>
              <span className="text-sm text-gray-500">
                Queue Size: {currentEvent.settings.maxQueueSize}
              </span>
            </div>
          </div>

          <QueueManager eventId={eventId} />
        </div>
      </div>
    </div>
  );
} 