import { describe, it, expect, beforeEach } from 'vitest';
import { RateLimiter } from '../rate-limit';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter();
  });

  it('should enforce rate limits correctly', async () => {
    const userId = 'test-user';
    const action = 'search';

    // First attempt should succeed
    expect(await rateLimiter.checkRateLimit(userId, action)).toBe(true);

    // Multiple rapid attempts should be blocked
    for (let i = 0; i < 10; i++) {
      await rateLimiter.checkRateLimit(userId, action);
    }

    // Should be rate limited now
    expect(await rateLimiter.checkRateLimit(userId, action)).toBe(false);
  });
}); 