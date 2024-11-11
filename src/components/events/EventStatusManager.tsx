'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogContent, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { analyticsService } from '@/lib/firebase/services/analytics';
import type { EventStatus } from '@/types/models';

interface Props {
  eventId: string;
}

export function EventStatusManager({ eventId }: Props) {
  const [status, setStatus] = useState<EventStatus>('active');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEventStatus();
  }, [eventId]);

  const fetchEventStatus = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/status`);
      if (!response.ok) throw new Error('Failed to fetch event status');
      const data = await response.json();
      setStatus(data.status);
    } catch (error) {
      console.error('Error fetching event status:', error);
      analyticsService.trackError(error as Error, {
        context: 'event_status_fetch'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateEventStatus = async (newStatus: EventStatus) => {
    try {
      const response = await fetch(`/api/events/${eventId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Failed to update event status');
      setStatus(newStatus);
      analyticsService.trackEvent('event_status_updated', {
        eventId,
        oldStatus: status,
        newStatus
      });
    } catch (error) {
      console.error('Error updating event status:', error);
      analyticsService.trackError(error as Error, {
        context: 'event_status_update'
      });
    }
  };

  const getStatusColor = (status: EventStatus) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'ended': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-medium">Event Status</h3>
          <Badge className={getStatusColor(status)}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>
        
        <div className="flex space-x-2">
          {status !== 'active' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateEventStatus('active')}
              disabled={loading}
            >
              Activate
            </Button>
          )}
          
          {status === 'active' && (
            <AlertDialog open={false} onOpenChange={() => {}}>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={loading}
                >
                  End Event
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4">End Event?</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    This will clear the queue and prevent new requests. This action cannot be undone.
                  </p>
                  <div className="flex justify-end space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {}}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => updateEventStatus('ended')}
                      disabled={loading}
                    >
                      End Event
                    </Button>
                  </div>
                </div>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </div>
  );
} 