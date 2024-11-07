import { useEffect } from 'react';
import { useEventStore } from '@/store/event';
import { eventService } from '@/lib/firebase/services/event';
import { Event } from '@/types/models';

interface EventDetailProps {
  eventId: string;
}

export function EventDetail({ eventId }: EventDetailProps) {
  const { currentEvent, setCurrentEvent, loading, setLoading, error, setError } = useEventStore();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = eventService.subscribeToEvent(eventId, (event) => {
      setCurrentEvent(event);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [eventId, setCurrentEvent, setLoading]);

  if (loading) {
    return <div className="flex justify-center p-8">Loading event details...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  if (!currentEvent) {
    return <div className="p-4">Event not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              {currentEvent.details.name}
            </h1>
            <EventStatusBadge status={currentEvent.status} />
          </div>
          
          <div className="mt-4 space-y-4">
            <EventInfo event={currentEvent} />
            <EventStats event={currentEvent} />
            <EventSettings event={currentEvent} />
          </div>
        </div>
      </div>
    </div>
  );
}

function EventStatusBadge({ status }: { status: Event['status'] }) {
  return (
    <span className={`px-3 py-1 rounded-full text-sm ${
      status === 'active' 
        ? 'bg-green-100 text-green-800' 
        : 'bg-gray-100 text-gray-800'
    }`}>
      {status}
    </span>
  );
}

function EventInfo({ event }: { event: Event }) {
  return (
    <div className="border-t pt-4">
      <h2 className="text-lg font-semibold mb-2">Event Details</h2>
      <dl className="grid grid-cols-2 gap-4">
        <div>
          <dt className="text-sm font-medium text-gray-500">Date</dt>
          <dd className="mt-1">
            {new Date(event.details.date).toLocaleDateString()}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Venue</dt>
          <dd className="mt-1">{event.details.venue || 'Not specified'}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Type</dt>
          <dd className="mt-1 capitalize">{event.details.type}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Description</dt>
          <dd className="mt-1">
            {event.details.description || 'No description'}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function EventStats({ event }: { event: Event }) {
  return (
    <div className="border-t pt-4">
      <h2 className="text-lg font-semibold mb-2">Statistics</h2>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-50 p-4 rounded">
          <dt className="text-sm font-medium text-gray-500">Attendees</dt>
          <dd className="mt-1 text-2xl font-semibold">
            {event.stats.attendeeCount}
          </dd>
        </div>
        <div className="bg-gray-50 p-4 rounded">
          <dt className="text-sm font-medium text-gray-500">Requests</dt>
          <dd className="mt-1 text-2xl font-semibold">
            {event.stats.requestCount}
          </dd>
        </div>
        <div className="bg-gray-50 p-4 rounded">
          <dt className="text-sm font-medium text-gray-500">Total Tips</dt>
          <dd className="mt-1 text-2xl font-semibold">
            ${event.stats.totalTips}
          </dd>
        </div>
      </div>
    </div>
  );
}

function EventSettings({ event }: { event: Event }) {
  return (
    <div className="border-t pt-4">
      <h2 className="text-lg font-semibold mb-2">Settings</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <dt className="text-sm font-medium text-gray-500">Tips</dt>
          <dd className="mt-1">
            {event.settings.allowTips ? 'Enabled' : 'Disabled'}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Approval Required</dt>
          <dd className="mt-1">
            {event.settings.requireApproval ? 'Yes' : 'No'}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">Queue Size</dt>
          <dd className="mt-1">{event.settings.maxQueueSize} songs</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-500">
            Blacklisted Genres
          </dt>
          <dd className="mt-1">
            {event.settings.blacklistedGenres.length 
              ? event.settings.blacklistedGenres.join(', ') 
              : 'None'}
          </dd>
        </div>
      </div>
    </div>
  );
} 