describe('Event Flow Integration', () => {
  let testEnv: TestEnvironment;
  let eventFlow: EventFlow;
  let djUser: TestUser;
  let attendeeUser: TestUser;

  beforeAll(async () => {
    testEnv = new TestEnvironment();
    await testEnv.setup();
  });

  afterAll(async () => {
    await testEnv.teardown();
  });

  beforeEach(async () => {
    // Create test users
    djUser = await testEnv.createTestUser('dj');
    attendeeUser = await testEnv.createTestUser('attendee');
    
    // Initialize event flow
    eventFlow = new EventFlow(testEnv.services);
  });

  it('should handle complete event lifecycle', async () => {
    // 1. DJ creates event
    const event = await eventFlow.createEvent(djUser.id, {
      name: 'Test Event',
      description: 'Integration Test'
    });

    // 2. Attendee joins event
    const joinResult = await eventFlow.joinEvent(attendeeUser.id, event.id);
    expect(joinResult.success).toBe(true);

    // 3. Attendee makes request
    const request = await eventFlow.createRequest(attendeeUser.id, {
      eventId: event.id,
      songId: 'test-song'
    });
    expect(request.status).toBe('pending');

    // 4. DJ approves request
    await eventFlow.approveRequest(djUser.id, request.id);
    const updatedRequest = await eventFlow.getRequest(request.id);
    expect(updatedRequest.status).toBe('approved');

    // 5. Verify queue update
    const queue = await eventFlow.getQueue(event.id);
    expect(queue.items).toContainEqual(
      expect.objectContaining({ songId: 'test-song' })
    );
  });

  it('should handle concurrent requests correctly', async () => {
    const event = await eventFlow.createEvent(djUser.id);
    
    // Make concurrent requests
    const requests = await Promise.all([
      eventFlow.createRequest(attendeeUser.id, { eventId: event.id, songId: 'song-1' }),
      eventFlow.createRequest(attendeeUser.id, { eventId: event.id, songId: 'song-2' }),
      eventFlow.createRequest(attendeeUser.id, { eventId: event.id, songId: 'song-3' })
    ]);

    // Verify all requests were handled
    expect(requests).toHaveLength(3);
    requests.forEach(request => {
      expect(request.status).toBe('pending');
    });
  });
}); 