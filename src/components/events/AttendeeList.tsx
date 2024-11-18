import { useEffect, useState, useCallback, useRef } from 'react';
import { AttendeeManagementService } from '@/lib/firebase/services/attendee';
import type { AttendeeSession } from '@/types/models';
import { useToast } from '@/components/ui/toast';

interface Props {
  eventId: string;
  isEventActive?: boolean;
  onAttendeeCountChange?: (count: number) => void;
}

export function AttendeeList({ eventId, isEventActive = true, onAttendeeCountChange }: Props) {
  const [attendees, setAttendees] = useState<AttendeeSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const attendeeService = new AttendeeManagementService();
  const toast = useToast();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const fetchAttendees = useCallback(() => {
    if (isEventActive) {
      try {
        unsubscribeRef.current = attendeeService.subscribeToAttendeeUpdates(
          eventId,
          (updatedAttendees) => {
            setAttendees(updatedAttendees);
            onAttendeeCountChange?.(updatedAttendees.length);
            setLoading(false);
            setError(null);
          }
        );
      } catch (err) {
        setError('Failed to subscribe to attendee updates');
        toast.error('Failed to load attendees');
        console.error('Subscription error:', err);
        setLoading(false);
      }

      // Update presence every 30 seconds
      const presenceInterval = setInterval(() => {
        attendeeService.updateAttendeePresence(eventId, 'current-user-id')
          .catch(console.error);
      }, 30000);

      return () => {
        unsubscribeRef.current?.();
        clearInterval(presenceInterval);
      };
    }
  }, [eventId, isEventActive, attendeeService, toast]);

  useEffect(() => {
    fetchAttendees();
  }, [attendeeService, onAttendeeCountChange, toast, fetchAttendees]);

  const handleStatusUpdate = async (attendeeId: string, newStatus: AttendeeSession['status']) => {
    try {
      await attendeeService.updateAttendeeStatus(eventId, attendeeId, newStatus);
      toast.success('Attendee status updated');
      await fetchAttendees();
    } catch (err) {
      toast.error('Failed to update attendee status');
      console.error('Failed to update status:', err);
    }
  };

  if (loading) return <div className="animate-pulse">Loading attendees...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Attendees ({attendees.length})</h3>
        <button 
          onClick={() => fetchAttendees()}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Refresh
        </button>
      </div>
      
      <div className="grid gap-2">
        {attendees.map((attendee) => (
          <div 
            key={attendee.userId}
            className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm"
          >
            <div className="flex items-center space-x-3">
              <span className="font-medium">{attendee.userId}</span>
              <span className="text-sm text-gray-500">
                {new Date(attendee.joinedAt).toLocaleTimeString()}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs ${
                attendee.status === 'active' ? 'bg-green-100 text-green-800' :
                attendee.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {attendee.status}
              </span>
              
              {isEventActive && (
                <select
                  value={attendee.status}
                  onChange={(e) => handleStatusUpdate(attendee.userId, e.target.value as AttendeeSession['status'])}
                  className="text-sm border rounded-md"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="blocked">Blocked</option>
                </select>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 