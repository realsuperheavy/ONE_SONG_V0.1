'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useEventStore } from '@/store/event';
import { eventService } from '@/lib/firebase/services/event';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function EventDetailsPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const { currentEvent, setCurrentEvent } = useEventStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const eventDetails = await eventService.getEvent(eventId);
        setCurrentEvent(eventDetails);
      } catch (error) {
        console.error('Failed to fetch event details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId, setCurrentEvent]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!currentEvent) {
    return <div>Event not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">{currentEvent.name}</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <p><strong>Status:</strong> {currentEvent.status}</p>
        <p><strong>DJ:</strong> {currentEvent.djId}</p>
        <p><strong>Attendees:</strong> {currentEvent.stats.attendeeCount}</p>
        <p><strong>Total Requests:</strong> {currentEvent.stats.requestCount}</p>
        <p><strong>Created At:</strong> {new Date(currentEvent.createdAt).toLocaleString()}</p>
      </div>
    </div>
  );
} 