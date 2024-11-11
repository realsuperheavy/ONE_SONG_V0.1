import { adminAuth, adminDb } from '@/lib/firebase/admin';
import type { UserProfile, Event } from '@/types/models';

export async function generateTestUser(role: 'dj' | 'attendee'): Promise<UserProfile> {
  // Create auth user
  const authUser = await adminAuth.createUser({
    email: `test-${Date.now()}@example.com`,
    password: 'testpass123',
    displayName: `Test ${role.toUpperCase()}`
  });

  // Set custom claims
  await adminAuth.setCustomUserClaims(authUser.uid, { role });

  // Create user profile
  const userProfile: Partial<UserProfile> = {
    id: authUser.uid,
    email: authUser.email,
    emailVerified: false,
    displayName: authUser.displayName,
    role,
    preferences: {
      theme: 'light',
      notifications: true,
      language: 'en',
      emailNotifications: true,
      updatedAt: new Date()
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await adminDb.collection('users').doc(authUser.uid).set(userProfile);
  return userProfile as UserProfile;
}

export async function generateTestEvent(djId: string): Promise<Event> {
  const eventData: Partial<Event> = {
    name: `Test Event ${Date.now()}`,
    djId,
    status: 'active',
    settings: {
      allowTips: true,
      requireApproval: true,
      maxQueueSize: 50,
      blacklistedGenres: []
    },
    stats: {
      attendeeCount: 0,
      requestCount: 0,
      totalTips: 0
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const eventRef = await adminDb.collection('events').add(eventData);
  return { id: eventRef.id, ...eventData } as Event;
} 