import { Page } from '@playwright/test';
import type { UserProfile } from '@/types/models';

export async function setupCustomCommands(page: Page) {
  page.login = async (user: UserProfile) => {
    // Set local storage for auth state
    await page.evaluate((userData) => {
      localStorage.setItem('auth_user', JSON.stringify(userData));
    }, user);

    // Set auth cookie
    const customToken = await generateCustomToken(user.id);
    await page.evaluate((token) => {
      document.cookie = `auth_token=${token}; path=/`;
    }, customToken);
  };
}

async function generateCustomToken(uid: string): Promise<string> {
  const { adminAuth } = await import('@/lib/firebase/admin');
  return adminAuth.createCustomToken(uid);
} 