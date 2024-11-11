import { test, expect } from '@playwright/test';
import { 
  initializeTestEnvironment,
  cleanupTestEnvironment 
} from '../utils/test-environment';
import { generateTestUser, generateTestEvent } from '../utils/test-data';
import { setupCustomCommands } from '../utils/custom-commands';

test.describe('Complex Event Flow', () => {
  let testEnv;

  test.beforeAll(async () => {
    testEnv = await initializeTestEnvironment();
  });

  test.afterAll(async () => {
    await cleanupTestEnvironment(testEnv);
  });

  test.beforeEach(async ({ page }) => {
    await setupCustomCommands(page);
  });

  test('complete DJ event management flow', async ({ page }) => {
    // Setup test data
    const dj = await generateTestUser('dj');
    const attendees = await Promise.all([
      generateTestUser('attendee'),
      generateTestUser('attendee'),
      generateTestUser('attendee')
    ]);
    const event = await generateTestEvent(dj.id);

    // DJ creates and configures event
    await test.step('DJ Event Setup', async () => {
      await page.login(dj);
      await page.goto('/events/create');
      await page.fill('[data-testid="event-name"]', event.name);
      await page.fill('[data-testid="max-queue-size"]', '50');
      await page.click('[data-testid="require-approval"]');
      await page.click('[data-testid="create-event"]');
      
      const eventUrl = page.url();
      expect(eventUrl).toMatch(/\/events\/[\w-]+$/);
    });

    // Multiple attendees join and request songs
    await test.step('Attendee Song Requests', async () => {
      for (const attendee of attendees) {
        await page.login(attendee);
        await page.goto(`/events/${event.id}`);
        await page.click('[data-testid="join-event"]');
        
        // Make song request
        await page.click('[data-testid="request-song"]');
        await page.fill('[data-testid="song-search"]', 'test song');
        await page.click('[data-testid="submit-request"]');
        
        // Verify request appears
        const request = await page.waitForSelector('[data-testid="song-request"]');
        expect(await request.isVisible()).toBeTruthy();
      }
    });

    // DJ manages requests and queue
    await test.step('DJ Queue Management', async () => {
      await page.login(dj);
      await page.goto(`/events/${event.id}`);

      // Approve requests
      const requests = await page.$$('[data-testid="approve-request"]');
      for (const request of requests) {
        await request.click();
        await page.waitForTimeout(500); // Wait for animation
      }

      // Verify queue
      const queueItems = await page.$$('[data-testid="queue-item"]');
      expect(queueItems.length).toBe(attendees.length);

      // Reorder queue
      const firstItem = queueItems[0];
      const dragHandle = await firstItem.$('[data-testid="drag-handle"]');
      await dragHandle.dragTo(queueItems[2]);

      // Verify new order
      const newOrder = await page.$$eval(
        '[data-testid="queue-item"]',
        items => items.map(item => item.getAttribute('data-song-id'))
      );
      expect(newOrder[2]).toBe(await firstItem.getAttribute('data-song-id'));
    });

    // Test error scenarios
    await test.step('Error Handling', async () => {
      // Test rate limiting
      await page.login(attendees[0]);
      await page.goto(`/events/${event.id}`);
      
      // Rapid requests should be blocked
      for (let i = 0; i < 3; i++) {
        await page.click('[data-testid="request-song"]');
        await page.fill('[data-testid="song-search"]', `test song ${i}`);
        await page.click('[data-testid="submit-request"]');
      }

      const errorMessage = await page.waitForSelector('[data-testid="error-message"]');
      expect(await errorMessage.textContent()).toContain('rate limit');
    });

    // Performance testing
    await test.step('Performance Checks', async () => {
      // Measure queue load time
      const queueLoadStart = Date.now();
      await page.goto(`/events/${event.id}`);
      await page.waitForSelector('[data-testid="queue-loaded"]');
      const queueLoadTime = Date.now() - queueLoadStart;
      expect(queueLoadTime).toBeLessThan(2000); // Should load within 2s

      // Measure request processing time
      const requestStart = Date.now();
      await page.click('[data-testid="request-song"]');
      await page.fill('[data-testid="song-search"]', 'test song');
      await page.click('[data-testid="submit-request"]');
      await page.waitForSelector('[data-testid="request-success"]');
      const requestTime = Date.now() - requestStart;
      expect(requestTime).toBeLessThan(3000); // Should process within 3s
    });
  });
}); 