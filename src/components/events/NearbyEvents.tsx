import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/hooks/useToast';
import { useGeolocation } from '@/hooks/useGeolocation';
import { eventService } from '@/lib/firebase/services/event';
import { ticketmasterService, TicketmasterEvent } from '@/lib/ticketmaster/services/events';
import type { Event } from '@/types/models';

export function NearbyEvents() {
  const [oneSongEvents, setOneSongEvents] = useState<Event[]>([]);
  const [ticketmasterEvents, setTicketmasterEvents] = useState<TicketmasterEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { showToast } = useToast();
  const { location, error: locationError } = useGeolocation();

  useEffect(() => {
    if (!location) return;

    const fetchEvents = async () => {
      try {
        const [oneSongResults, ticketmasterResults] = await Promise.all([
          eventService.getNearbyEvents(location.latitude, location.longitude),
          ticketmasterService.getNearbyEvents(location.latitude, location.longitude)
        ]);

        setOneSongEvents(oneSongResults);
        setTicketmasterEvents(ticketmasterResults);
      } catch (error) {
        console.error('Failed to fetch events:', error);
        showToast({
          title: "Error",
          description: "Failed to fetch nearby events. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [location, showToast]);

  const handleJoinEvent = (eventId: string) => {
    router.push(`/events/${eventId}/queue`);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size={40} />
      </div>
    );
  }

  if (locationError) {
    return (
      <Card className="p-6 text-center text-red-500">
        {locationError}
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">OneSong Events Near You</h2>
        {oneSongEvents.length === 0 ? (
          <Card className="p-6 text-center text-gray-500">
            No OneSong events found nearby
          </Card>
        ) : (
          oneSongEvents.map((event) => (
            <Card key={event.id} className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{event.name}</h3>
                  <p className="text-sm text-gray-500">
                    {event.stats.attendeeCount} attendees
                  </p>
                </div>
                <Button onClick={() => handleJoinEvent(event.id)}>
                  Join Event
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Ticketed Events Near You</h2>
        {ticketmasterEvents.length === 0 ? (
          <Card className="p-6 text-center text-gray-500">
            No ticketed events found nearby
          </Card>
        ) : (
          ticketmasterEvents.map((event) => (
            <Card key={event.id} className="p-6">
              <div className="flex gap-4">
                {event.images?.[0] && (
                  <img
                    src={event.images[0].url}
                    alt={event.name}
                    className="w-24 h-24 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">{event.name}</h3>
                      <p className="text-sm text-gray-500">
                        {event._embedded.venues[0]?.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {event._embedded.venues[0]?.city.name}, {event._embedded.venues[0]?.state.stateCode}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(event.dates.start.localDate).toLocaleDateString()} 
                        {event.dates.start.localTime && ` at ${event.dates.start.localTime}`}
                      </p>
                      {event.priceRanges && (
                        <p className="text-sm font-medium mt-2">
                          {event.priceRanges[0].min === event.priceRanges[0].max
                            ? `$${event.priceRanges[0].min}`
                            : `$${event.priceRanges[0].min} - $${event.priceRanges[0].max}`}
                        </p>
                      )}
                    </div>
                    <Button 
                      as="a" 
                      href={event.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="ml-4"
                    >
                      Buy Tickets
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
} 