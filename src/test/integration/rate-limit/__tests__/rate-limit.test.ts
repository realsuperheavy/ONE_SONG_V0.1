import { describe, it, expect, beforeEach } from '@jest/globals';
import { RateLimitService } from '@/lib/services/rate-limit';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import { analyticsService } from '@/lib/firebase/services/analytics';

describe('Rate Limit Integration Tests', () => {
  const testEventId = 'test-event-123';
  const testUserId = 'test-user-123';

  beforeEach(async () => {
    // Clean up any existing rate limit records
    const rateLimitRef = collection(db, `events/${testEventId}/rateLimits`);
    const q = query(rateLimitRef, where('userId', '==', testUserId));
    const snapshot = await getDocs(q);
    await Promise.all(snapshot.docs.map(doc => deleteDoc(doc.ref)));
  });

  it('should allow requests within rate limit', async () => {
    const rateLimitService = new RateLimitService(testUserId, testEventId);
    const results = await Promise.all([
      rateLimitService.checkRateLimit(),
      rateLimitService.checkRateLimit(),
      rateLimitService.checkRateLimit()
    ]);

    expect(results.every(result => result === true)).toBe(true);
    analyticsService.trackEvent('rate_limit_test', {
      type: 'within_limit',
      success: true
    });
  });

  it('should block requests when rate limit exceeded', async () => {
    const rateLimitService = new RateLimitService(testUserId, testEventId);
    
    // Make max allowed requests
    for (let i = 0; i < 5; i++) {
      await rateLimitService.checkRateLimit();
    }

    // This request should be blocked
    const result = await rateLimitService.checkRateLimit();
    expect(result).toBe(false);
  });
}); 