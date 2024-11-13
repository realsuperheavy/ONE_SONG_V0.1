import { test, expect } from '@playwright/test';

test('landing page shows join event form', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Join an Event')).toBeVisible();
}); 