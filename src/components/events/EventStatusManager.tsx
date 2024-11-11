import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogContent, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { EventAdminService } from '@/lib/firebase/admin/events';
import { analyticsService } from '@/lib/firebase/services/analytics';
import type { Event } from '@/types/models';

interface Props {
  eventId: string;
  initialStatus: Event['status'];
  onStatusChange?: (newStatus: Event['status']) => void;
}

export function EventStatusManager({ eventId, initialStatus, onStatusChange }: Props) {
  const [status, setStatus] = useState<Event['status']>(initialStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const eventAdminService = new EventAdminService();

  const handleStatusChange = async (newStatus: Event['status']) => {
    setIsUpdating(true);
    try {
      await eventAdminService.batchUpdateEventStatus([eventId], newStatus);
      setStatus(newStatus);
      onStatusChange?.(newStatus);
      
      analyticsService.trackEvent('event_status_changed', {
        eventId,
        oldStatus: status,
        newStatus
      });
    } catch (error) {
      console.error('Failed to update event status:', error);
    } finally {
      setIsUpdating(false);
      setShowConfirmDialog(false);
    }
  };

  const getStatusColor = (status: Event['status']) => {
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
              onClick={() => handleStatusChange('active')}
              disabled={isUpdating}
            >
              Activate
            </Button>
          )}
          
          {status === 'active' && (
            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={isUpdating}
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
                      onClick={() => setShowConfirmDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleStatusChange('ended')}
                      disabled={isUpdating}
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