import { 
  doc, 
  collection, 
  addDoc, 
  updateDoc, 
  getDoc, 
  query, 
  where, 
  onSnapshot 
} from '@firebase/firestore';
import { db } from '../config';
import { Event } from '@/types/models';

export const eventService = {
  createEvent: async (eventData: Partial<Event>, djId: string): Promise<string> => {
    try {
      const eventRef = collection(db, 'events');
      const newEvent = {
        ...eventData,
        djId,
        status: 'active',
        stats: {
          attendeeCount: 0,
          requestCount: 0,
          totalTips: 0
        },
        settings: {
          ...eventData.settings,
          allowTips: true,
          requireApproval: true,
          maxQueueSize: 50,
          blacklistedGenres: []
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(eventRef, newEvent);
      return docRef.id;
    } catch (error) {
      throw new Error(`Failed to create event: ${error}`);
    }
  },

  updateEvent: async (eventId: string, updates: Partial<Event>): Promise<void> => {
    try {
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      throw new Error(`Failed to update event: ${error}`);
    }
  },

  getEvent: async (eventId: string): Promise<Event> => {
    try {
      const eventRef = doc(db, 'events', eventId);
      const eventDoc = await getDoc(eventRef);
      
      if (!eventDoc.exists()) {
        throw new Error('Event not found');
      }

      return { id: eventDoc.id, ...eventDoc.data() } as Event;
    } catch (error) {
      throw new Error(`Failed to get event: ${error}`);
    }
  },

  subscribeToEvent: (eventId: string, callback: (event: Event) => void) => {
    const eventRef = doc(db, 'events', eventId);
    
    return onSnapshot(eventRef, (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() } as Event);
      }
    });
  },

  getDJEvents: (djId: string, callback: (events: Event[]) => void) => {
    const eventsQuery = query(
      collection(db, 'events'),
      where('djId', '==', djId)
    );

    return onSnapshot(eventsQuery, (snapshot) => {
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Event[];
      callback(events);
    });
  }
}; 