import { WebhookService } from '../config';
import { analyticsService } from '@/lib/firebase/services/analytics';
import { generateMockPayload } from '@/test/utils';

describe('Webhook Load Testing', () => {
  let webhookService: WebhookService;
  const CONCURRENT_REQUESTS = 1000;
  const RATE_LIMIT = 100;
  const WINDOW_MS = 1000;

  beforeEach(() => {
    webhookService = new WebhookService();
    webhookService.registerWebhook('load-test', {
      url: 'https://test.com/webhook',
      secret: 'test-secret',
      events: ['test.event'],
      rateLimit: {
        maxRequests: RATE_LIMIT,
        windowMs: WINDOW_MS
      }
    });
  });

  it('handles concurrent webhook deliveries', async () => {
    const startTime = Date.now();
    const requests = Array(CONCURRENT_REQUESTS).fill(null).map(() => 
      webhookService.triggerWebhook('load-test', 'test.event', generateMockPayload())
    );

    const results: PromiseSettledResult<void>[] = await Promise.allSettled(requests);
    const endTime = Date.now();

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    const duration = endTime - startTime;

    expect(successful).toBeGreaterThan(0);
    expect(duration).toBeLessThan(30000); // 30s max
    
    // Verify rate limiting worked
    const rateExceededErrors = results.filter(
      r => r.status === 'rejected' && 
      r.reason.message.includes('Rate limit exceeded')
    ).length;

    expect(rateExceededErrors).toBeGreaterThan(0);
  });

  it('maintains performance under sustained load', async () => {
    const DURATION = 60000; // 1 minute test
    const INTERVAL = 100; // 100ms between requests
    const startTime = Date.now();
    const metrics: number[] = [];

    while (Date.now() - startTime < DURATION) {
      const deliveryStart = Date.now();
      try {
        await webhookService.triggerWebhook(
          'load-test', 
          'test.event',
          generateMockPayload()
        );
        metrics.push(Date.now() - deliveryStart);
      } catch (err) {
        const error = err as Error;
        if (!error.message.includes('Rate limit exceeded')) {
          throw error;
        }
      }
      await new Promise(resolve => setTimeout(resolve, INTERVAL));
    }

    const avgDeliveryTime = metrics.reduce((a, b) => a + b, 0) / metrics.length;
    expect(avgDeliveryTime).toBeLessThan(200); // 200ms max average
  });

  afterEach(() => {
    webhookService.cleanup();
  });
}); 