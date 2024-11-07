import { Page } from 'playwright';
import { firebaseAdmin } from '@/lib/firebase/admin';

export const e2eUtils = {
  async loginAsDJ(page: Page, email: string, password: string) {
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', email);
    await page.fill('[data-testid="password-input"]', password);
    await page.click('[data-testid="login-button"]');
    await page.waitForNavigation();
  },

  async createTestEvent() {
    const eventRef = await firebaseAdmin.firestore().collection('events').add({
      name: 'Test Event',
      djId: 'test-dj',
      status: 'active',
      createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
    });
    return eventRef.id;
  },

  async cleanupTestData() {
    const batch = firebaseAdmin.firestore().batch();
    const testEvents = await firebaseAdmin.firestore()
      .collection('events')
      .where('name', '==', 'Test Event')
      .get();
    
    testEvents.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  }
}; 