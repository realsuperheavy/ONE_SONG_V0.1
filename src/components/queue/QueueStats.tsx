import { useEffect, useState } from 'react';
import { Event } from '@/types/models';
import { eventService } from '@/lib/firebase/services/event';

interface QueueStatsProps {
  eventId: string;
}

export function QueueStats({ eventId }: QueueStatsProps) {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = eventService.subscribeToEvent(eventId, (updatedEvent) => {
      setEvent(updatedEvent);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [eventId]);

  if (loading) {
    return <div className="animate-pulse h-16 bg-gray-200 rounded" />;
  }

  if (error) {
    return <div className="text-red-500 text-sm">{error}</div>;
  }

  if (!event) {
    return null;
  }

  return (
    <div className="grid grid-cols-3 gap-4 p-4 bg-white rounded-lg shadow">
      <div className="text-center">
        <div className="text-sm font-medium text-gray-500">Queue Size</div>
        <div className="mt-1 text-2xl font-semibold text-gray-900">
          {event.settings.maxQueueSize}
        </div>
      </div>
      <div className="text-center">
        <div className="text-sm font-medium text-gray-500">Total Requests</div>
        <div className="mt-1 text-2xl font-semibold text-gray-900">
          {event.stats.requestCount}
        </div>
      </div>
      <div className="text-center">
        <div className="text-sm font-medium text-gray-500">Total Tips</div>
        <div className="mt-1 text-2xl font-semibold text-gray-900">
          ${event.stats.totalTips}
        </div>
      </div>
    </div>
  );
} 