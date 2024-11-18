import React, { useEffect, useState } from 'react';
import { getEvents } from '@/lib/firebase/services/eventService';
import type { Event } from '@/types/event';

const EventList: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      const eventsData = await getEvents();
      setEvents(eventsData);
    };
    fetchEvents();
  }, []);

  return (
    <ul>
      {events.map((event) => (
        <li key={event.id}>{event.name}</li>
      ))}
    </ul>
  );
};

export default EventList; 