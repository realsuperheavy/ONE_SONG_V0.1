import { useState, useEffect } from 'react';
import { ref, onValue, query, orderByChild, limitToLast } from 'firebase/database';
import { rtdb } from '@/lib/firebase/config';
import type { DateRange } from '@/components/ui/date-range-picker';

interface ActivityItem {
  timestamp: string;
  value: number;
  type: string;
}

interface EventActivity {
  events: ActivityItem[];
  peakValue: number;
  average: number;
  totalActions: number;
  uniqueUsers: number;
}

export function useEventActivity(eventId: string, dateRange?: DateRange) {
  const [activity, setActivity] = useState<EventActivity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!eventId) return;

    setIsLoading(true);
    const activityRef = ref(rtdb, `events/${eventId}/activity`);
    const activityQuery = query(
      activityRef,
      orderByChild('timestamp'),
      limitToLast(100)
    );

    const unsubscribe = onValue(activityQuery, (snapshot) => {
      try {
        const data = snapshot.val();
        if (!data) {
          setActivity({
            events: [],
            peakValue: 0,
            average: 0,
            totalActions: 0,
            uniqueUsers: 0
          });
          return;
        }

        const events: ActivityItem[] = Object.values(data);
        
        // Filter by date range if provided
        const filteredEvents = dateRange?.from && dateRange?.to
          ? events.filter(event => {
              const eventDate = new Date(event.timestamp);
              return eventDate >= dateRange.from! && eventDate <= dateRange.to!;
            })
          : events;

        // Calculate metrics
        const values = filteredEvents.map(e => e.value);
        const peakValue = Math.max(...values, 0);
        const average = values.length 
          ? values.reduce((a, b) => a + b, 0) / values.length 
          : 0;

        // Get unique users
        const uniqueUsers = new Set(
          filteredEvents.map(e => e.type === 'user_action' ? e.value : null)
        ).size;

        setActivity({
          events: filteredEvents,
          peakValue,
          average: Math.round(average * 100) / 100,
          totalActions: filteredEvents.length,
          uniqueUsers
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to process activity data'));
      } finally {
        setIsLoading(false);
      }
    }, (err) => {
      setError(err);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [eventId, dateRange?.from, dateRange?.to]);

  return {
    activity,
    isLoading,
    error
  };
} 