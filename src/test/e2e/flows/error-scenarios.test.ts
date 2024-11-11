import { test, expect } from '@playwright/test';
import { 
  initializeTestEnvironment,
  cleanupTestEnvironment 
} from '../utils/test-environment';
import { generateTestUser, generateTestEvent } from '../utils/test-data';
import { setupCustomCommands } from '../utils/custom-commands';

test.describe('Error Scenarios', () => {
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

  test('handles network errors gracefully', async ({ page }) => {
    const dj = await generateTestUser('dj');
    const event = await generateTestEvent(dj.id);

    await page.login(dj);
    await page.goto(`/events/${event.id}`);

    // Simulate offline mode
    await page.context().setOffline(true);

    // Try to update event settings
    await page.click('[data-testid="event-settings"]');
    await page.fill('[data-testid="max-queue-size"]', '100');
    await page.click('[data-testid="save-settings"]');

    // Should show offline error message
    const errorMessage = await page.waitForSelector('[data-testid="error-message"]');
    expect(await errorMessage.textContent()).toContain('offline');

    // Verify retry mechanism
    await page.context().setOffline(false);
    await page.click('[data-testid="retry-button"]');
    
    // Should show success message
    const successMessage = await page.waitForSelector('[data-testid="success-message"]');
    expect(await successMessage.textContent()).toContain('saved');
  });

  test('handles concurrent modifications', async ({ browser }) => {
    const dj = await generateTestUser('dj');
    const event = await generateTestEvent(dj.id);

    // Create two browser contexts for concurrent access
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    await setupCustomCommands(page1);
    await setupCustomCommands(page2);

    // Both DJs try to modify the same event
    await page1.login(dj);
    await page2.login(dj);

    await page1.goto(`/events/${event.id}`);
    await page2.goto(`/events/${event.id}`);

    // Make concurrent modifications
    await Promise.all([
      page1.click('[data-testid="end-event"]'),
      page2.click('[data-testid="update-settings"]')
    ]);

    // Should show conflict resolution message
    const errorMessage = await page2.waitForSelector('[data-testid="error-message"]');
    expect(await errorMessage.textContent()).toContain('modified by another user');
  });
}); 