import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useEffect, useState } from 'react';
import type { Event } from '@/types/event';

const useEventListener = (eventId: string) => {
  const [event, setEvent] = useState<Event | null>(null);

  useEffect(() => {
    const eventDoc = doc(db, 'events', eventId);
    const unsubscribe = onSnapshot(eventDoc, (docSnapshot) => {
      if (docSnapshot.exists()) {
        setEvent({ id: docSnapshot.id, ...(docSnapshot.data() as Event) });
      }
    });
    return () => unsubscribe();
  }, [eventId]);

  return event;
};

export default useEventListener; 