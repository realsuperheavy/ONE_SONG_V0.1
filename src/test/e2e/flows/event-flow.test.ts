import { test, expect } from '@playwright/test';
import { 
  initializeTestEnvironment,
  cleanupTestEnvironment 
} from '../utils/test-environment';
import { generateTestUser, generateTestEvent } from '../utils/test-data';

test.describe('Event Flow', () => {
  let testEnv;

  test.beforeAll(async () => {
    testEnv = await initializeTestEnvironment();
  });

  test.afterAll(async () => {
    await cleanupTestEnvironment(testEnv);
  });

  test('complete event lifecycle', async ({ page }) => {
    // Setup test data
    const dj = await generateTestUser('dj');
    const attendee = await generateTestUser('attendee');
    const event = await generateTestEvent(dj.id);

    // DJ creates and configures event
    await page.goto('/events/create');
    await page.login(dj);
    await page.fill('[data-testid="event-name"]', event.name);
    await page.click('[data-testid="create-event"]');
    
    // Verify event creation
    const eventUrl = page.url();
    expect(eventUrl).toMatch(/\/events\/[\w-]+$/);

    // Attendee joins and requests song
    await page.login(attendee);
    await page.goto(eventUrl);
    await page.click('[data-testid="request-song"]');
    await page.fill('[data-testid="song-search"]', 'test song');
    await page.click('[data-testid="submit-request"]');

    // Verify request appears in queue
    const request = await page.waitForSelector('[data-testid="song-request"]');
    expect(await request.isVisible()).toBeTruthy();

    // DJ approves request
    await page.login(dj);
    await page.reload();
    await page.click('[data-testid="approve-request"]');

    // Verify request status updated
    const status = await page.waitForSelector('[data-testid="request-status"]');
    expect(await status.textContent()).toBe('Approved');
  });
}); 