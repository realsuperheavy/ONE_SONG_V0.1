import { collection, addDoc, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Event } from '@/types/event';

const eventsCollection = collection(db, 'events');

export const createEvent = async (eventData: Partial<Event>) => {
  const docRef = await addDoc(eventsCollection, {
    ...eventData,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  return docRef.id;
};

export const getEvents = async (): Promise<Event[]> => {
  const snapshot = await getDocs(eventsCollection);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Event));
};

export const updateEvent = async (eventId: string, eventData: Partial<Event>) => {
  const eventDoc = doc(eventsCollection, eventId);
  await updateDoc(eventDoc, {
    ...eventData,
    updatedAt: Date.now(),
  });
}; 