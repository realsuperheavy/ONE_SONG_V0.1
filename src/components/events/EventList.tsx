import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { useEventStore } from '@/store/event';
import { eventService } from '@/lib/firebase/services/event';
import { Event } from '@/types/models';

export function EventList() {
  const user = useAuthStore((state) => state.user);
  const { djEvents, setDJEvents, loading, setLoading, error, setError } = useEventStore();

  useEffect(() => {
    if (!user?.id) return;

    setLoading(true);
    const unsubscribe = eventService.getDJEvents(user.id, (events) => {
      setDJEvents(events);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.id, setDJEvents, setLoading]);

  if (loading) {
    return <div className="flex justify-center p-8">Loading events...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {djEvents.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}

interface EventCardProps {
  event: Event;
}

function EventCard({ event }: EventCardProps) {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900">
          {event.details.name}
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          {event.details.description || 'No description'}
        </p>
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {new Date(event.details.date).toLocaleDateString()}
          </div>
          <span className={`px-2 py-1 rounded-full text-xs ${
            event.status === 'active' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {event.status}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-sm text-gray-600">
          <div>
            <span className="font-medium">{event.stats.attendeeCount}</span>
            <span className="ml-1">attendees</span>
          </div>
          <div>
            <span className="font-medium">{event.stats.requestCount}</span>
            <span className="ml-1">requests</span>
          </div>
          <div>
            <span className="font-medium">${event.stats.totalTips}</span>
            <span className="ml-1">tips</span>
          </div>
        </div>
      </div>
      <div className="px-6 py-4 bg-gray-50 border-t">
        <a 
          href={`/events/${event.id}`}
          className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
        >
          View Details →
        </a>
      </div>
    </div>
  );
} 