import { test, expect } from '@playwright/test';
import { e2eUtils } from '../utils';

test.describe('DJ Event Management Flow', () => {
  let eventId: string;

  test.beforeEach(async () => {
    eventId = await e2eUtils.createTestEvent();
  });

  test.afterEach(async () => {
    await e2eUtils.cleanupTestData();
  });

  test('DJ can create and manage an event', async ({ page }) => {
    // Login
    await e2eUtils.loginAsDJ(page, 'test@dj.com', 'password');

    // Create event
    await page.click('[data-testid="create-event-button"]');
    await page.fill('[data-testid="event-name-input"]', 'New Test Event');
    await page.click('[data-testid="submit-event-button"]');

    // Verify event creation
    await expect(page.locator('[data-testid="event-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="event-name"]')).toHaveText('New Test Event');

    // Manage requests
    await page.click('[data-testid="requests-tab"]');
    await expect(page.locator('[data-testid="requests-panel"]')).toBeVisible();

    // Check queue management
    await page.click('[data-testid="queue-tab"]');
    await expect(page.locator('[data-testid="queue-panel"]')).toBeVisible();
  });

  test('DJ can handle song requests', async ({ page }) => {
    await e2eUtils.loginAsDJ(page, 'test@dj.com', 'password');
    await page.goto(`/event/${eventId}`);

    // Add test request
    await e2eUtils.createTestRequest(eventId);

    // Verify request appears
    await expect(page.locator('[data-testid="request-item"]')).toBeVisible();

    // Approve request
    await page.click('[data-testid="approve-request-button"]');
    await expect(page.locator('[data-testid="queue-item"]')).toBeVisible();
  });
}); 