import { test, expect } from '@playwright/test';
import { analyticsService } from '@/lib/firebase/services/analytics';

test.describe('Attendee Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('complete attendee journey', async ({ page }) => {
    // Landing page
    await expect(page.getByRole('heading', { name: 'Join an Event' })).toBeVisible();
    
    // Join event
    const eventCode = 'TEST123';
    await page.getByPlaceholder('Enter event code').fill(eventCode);
    await page.getByRole('button', { name: 'Join' }).click();
    
    // Queue view
    await expect(page.getByRole('heading', { name: /Event Queue/ })).toBeVisible();
    
    // Request song
    await page.getByRole('button', { name: 'Request Song' }).click();
    await expect(page.getByText('Search for a Song')).toBeVisible();
    
    // Search and select song
    await page.getByPlaceholder('Search songs...').fill('Test Song');
    await expect(page.getByText('Test Song')).toBeVisible();
    await page.getByText('Test Song').click();
    
    // Add message and submit
    await page.getByPlaceholder('Add a message').fill('Test request');
    await page.getByRole('button', { name: 'Submit Request' }).click();
    
    // Verify request in queue
    await expect(page.getByText('Test Song')).toBeVisible();
    await expect(page.getByText('Test request')).toBeVisible();
  });

  test('offline functionality', async ({ page }) => {
    await page.context().setOffline(true);
    
    // Verify offline indicator
    await expect(page.getByText("You're offline")).toBeVisible();
    
    // Try to make request
    await page.getByRole('button', { name: 'Request Song' }).click();
    await expect(page.getByText('Request will be submitted when online')).toBeVisible();
    
    // Go back online
    await page.context().setOffline(false);
    await expect(page.getByText('Request submitted successfully')).toBeVisible();
  });

  test('error handling', async ({ page }) => {
    // Invalid event code
    await page.getByPlaceholder('Enter event code').fill('INVALID');
    await page.getByRole('button', { name: 'Join' }).click();
    await expect(page.getByText('Invalid event code')).toBeVisible();
    
    // Network error
    await page.route('**/api/**', route => route.abort());
    await page.getByRole('button', { name: 'Join' }).click();
    await expect(page.getByText('Failed to join event')).toBeVisible();
  });

  test('real-time updates', async ({ page }) => {
    // Join event
    await page.getByPlaceholder('Enter event code').fill('TEST123');
    await page.getByRole('button', { name: 'Join' }).click();
    
    // Verify real-time updates
    await expect(page.getByText('Queue updated')).toBeVisible();
    
    // Verify vote functionality
    await page.getByRole('button', { name: 'Vote' }).first().click();
    await expect(page.getByText('Vote submitted')).toBeVisible();
  });
}); 