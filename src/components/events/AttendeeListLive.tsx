import { useEffect, useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { adminDb } from '@/lib/firebase/admin';
import { analyticsService } from '@/lib/firebase/services/analytics';
import type { UserProfile } from '@/types/models';

interface Props {
  eventId: string;
  maxHeight?: string;
}

interface AttendeeWithStatus extends UserProfile {
  status: 'online' | 'offline';
  lastActive: Date;
}

export function AttendeeListLive({ eventId, maxHeight = '400px' }: Props) {
  const [attendees, setAttendees] = useState<AttendeeWithStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const attendeesRef = adminDb
      .collection('events')
      .doc(eventId)
      .collection('attendees');

    const unsubscribe = attendeesRef
      .where('status', '==', 'active')
      .onSnapshot(
        (snapshot) => {
          const updates: AttendeeWithStatus[] = [];
          
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added' || change.type === 'modified') {
              const data = change.doc.data();
              updates.push({
                ...data,
                id: change.doc.id,
                status: Date.now() - data.lastActive.toMillis() < 300000 ? 'online' : 'offline',
                lastActive: data.lastActive.toDate()
              } as AttendeeWithStatus);
            }
          });

          setAttendees(prev => {
            const newAttendees = [...prev];
            updates.forEach(update => {
              const index = newAttendees.findIndex(a => a.id === update.id);
              if (index >= 0) {
                newAttendees[index] = update;
              } else {
                newAttendees.push(update);
              }
            });
            return newAttendees;
          });

          setLoading(false);
        },
        (error) => {
          console.error('Error fetching attendees:', error);
          analyticsService.trackError(error, {
            context: 'attendee_list_subscription'
          });
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, [eventId]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Attendees</h3>
        <span className="text-sm text-gray-500">
          {attendees.filter(a => a.status === 'online').length} online
        </span>
      </div>

      <ScrollArea className={`w-full`} style={{ maxHeight }}>
        <div className="space-y-2">
          {attendees.map((attendee) => (
            <div
              key={attendee.id}
              className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50"
            >
              <Avatar
                src={attendee.photoURL}
                alt={attendee.displayName || 'Attendee'}
                className="h-8 w-8"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {attendee.displayName || 'Anonymous'}
                </p>
                <p className="text-xs text-gray-500">
                  {attendee.status === 'online' ? 'Online' : 'Away'}
                </p>
              </div>
              <div className={`h-2 w-2 rounded-full ${
                attendee.status === 'online' ? 'bg-green-400' : 'bg-gray-300'
              }`} />
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
} 