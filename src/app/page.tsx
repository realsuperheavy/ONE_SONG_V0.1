'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { JoinEventForm } from '@/components/events/JoinEventForm';
import { NearbyEvents } from '@/components/events/NearbyEvents';
import { useToast } from '@/hooks/useToast';
import { eventService } from '@/lib/firebase/services/event';
import { analyticsService } from '@/lib/firebase/services/analytics';

export default function LandingPage() {
  const [showNearbyEvents, setShowNearbyEvents] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const handleJoinEvent = async (code: string) => {
    try {
      const event = await eventService.getEventByCode(code);
      analyticsService.trackEvent('event_join_attempt', {
        method: 'code',
        eventId: event.id,
        success: true
      });
      router.push(`/events/${event.id}/queue`);
    } catch (error) {
      showToast({
        title: "Error",
        description: "Invalid event code. Please try again.",
        variant: "destructive"
      });
      analyticsService.trackEvent('event_join_attempt', {
        method: 'code',
        code,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-md mx-auto p-6">
        <h1 className="text-2xl font-bold text-center mb-6">
          Join an Event
        </h1>
        <JoinEventForm onSubmit={handleJoinEvent} />
        
        <div className="mt-6">
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => setShowNearbyEvents(!showNearbyEvents)}
          >
            {showNearbyEvents ? 'Hide Nearby Events' : 'Show Nearby Events'}
          </Button>
        </div>
      </Card>

      {showNearbyEvents && <NearbyEvents />}
    </div>
  );
}