import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AttendeeManagementService } from '@/lib/firebase/services/attendee';
import { EventManager } from '@/features/events/EventManagement';
import { firebaseAdmin } from '@/lib/firebase/admin';
import { generateTestUser, generateTestEvent } from '@/test/e2e/utils/test-data';
import type { UserProfile, Event } from '@/types/models';

describe('Attendee Management Integration', () => {
  let attendeeService: AttendeeManagementService;
  let eventManager: EventManager;
  let testEvent: Event;
  let testUser: UserProfile;
  
  beforeEach(async () => {
    attendeeService = new AttendeeManagementService();
    eventManager = new EventManager();
    
    // Create test data
    testUser = await generateTestUser('attendee');
    testEvent = await generateTestEvent('test-dj');
  });

  afterEach(async () => {
    // Cleanup test data
    await firebaseAdmin.firestore()
      .collection('events')
      .doc(testEvent.id)
      .delete();
    
    await firebaseAdmin.firestore()
      .collection('users')
      .doc(testUser.id)
      .delete();
  });

  it('handles complete attendee lifecycle', async () => {
    // Join event
    await attendeeService.joinEvent(testEvent.id, testUser.id);
    
    // Verify attendee joined
    const attendees = await attendeeService.getEventAttendees(testEvent.id);
    expect(attendees).toContainEqual(
      expect.objectContaining({
        userId: testUser.id,
        status: 'active'
      })
    );

    // Update status
    await attendeeService.updateAttendeeStatus(
      testEvent.id,
      testUser.id,
      'inactive'
    );

    // Verify status updated
    const updatedAttendees = await attendeeService.getEventAttendees(
      testEvent.id,
      { status: 'inactive' }
    );
    expect(updatedAttendees[0].status).toBe('inactive');

    // Remove attendee
    await attendeeService.removeAttendee(testEvent.id, testUser.id);

    // Verify attendee removed
    const finalAttendees = await attendeeService.getEventAttendees(testEvent.id);
    expect(finalAttendees).toHaveLength(0);
  });

  it('handles concurrent attendee operations', async () => {
    const users = await Promise.all([
      generateTestUser('attendee'),
      generateTestUser('attendee'),
      generateTestUser('attendee')
    ]);

    // Concurrent joins
    await Promise.all(
      users.map(user => 
        attendeeService.joinEvent(testEvent.id, user.id)
      )
    );

    const attendees = await attendeeService.getEventAttendees(testEvent.id);
    expect(attendees).toHaveLength(users.length);
  });
}); 