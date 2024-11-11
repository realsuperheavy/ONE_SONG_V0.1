import { useEffect, useState } from 'react';
import { AttendeeManagementService } from '@/lib/firebase/services/attendee';
import type { AttendeeSession } from '@/types/models';

interface Props {
  eventId: string;
}

export function AttendeeList({ eventId }: Props) {
  const [attendees, setAttendees] = useState<AttendeeSession[]>([]);
  const [loading, setLoading] = useState(true);
  const attendeeService = new AttendeeManagementService();

  useEffect(() => {
    const loadAttendees = async () => {
      try {
        const data = await attendeeService.getEventAttendees(eventId);
        setAttendees(data);
      } catch (error) {
        console.error('Failed to load attendees:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAttendees();
  }, [eventId]);

  if (loading) return <div>Loading attendees...</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Attendees ({attendees.length})</h3>
      <div className="grid gap-2">
        {attendees.map((attendee) => (
          <div 
            key={attendee.userId}
            className="flex items-center justify-between p-2 bg-white rounded-md shadow-sm"
          >
            <span>{attendee.userId}</span>
            <span className={`px-2 py-1 rounded-full text-xs ${
              attendee.status === 'active' ? 'bg-green-100 text-green-800' :
              attendee.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {attendee.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
} 