import { WebhookService } from '../config';
import { analyticsService } from '@/lib/firebase/services/analytics';
import { Cache } from '@/lib/cache';
import { getFunctions, httpsCallable } from 'firebase/functions';
import type { WebhookConfig, WebhookEventType } from '@/types/webhooks';

// Mock dependencies
vi.mock('@/lib/firebase/services/analytics');
vi.mock('@/lib/cache');
vi.mock('firebase/functions');

describe('WebhookService', () => {
  let webhookService: WebhookService;
  let mockHttpsCallable: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup mock functions
    mockHttpsCallable = vi.fn();
    (getFunctions as jest.Mock).mockReturnValue({});
    (httpsCallable as jest.Mock).mockReturnValue(mockHttpsCallable);

    // Initialize service
    webhookService = new WebhookService();
  });

  describe('Webhook Registration', () => {
    const validConfig = {
      url: 'https://test.com/webhook',
      secret: 'test-secret',
      events: ['song.requested', 'song.played'],
      rateLimit: {
        maxRequests: 100,
        windowMs: 60000
      }
    };

    it('registers a webhook with valid configuration', async () => {
      webhookService.registerWebhook('test-hook', validConfig);
      
      const config = webhookService.getWebhookConfig('test-hook');
      expect(config).toBeDefined();
      expect(config?.url).toBe(validConfig.url);
      expect(config?.events).toEqual(validConfig.events);
      
      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        'webhook_registered',
        expect.any(Object)
      );
    });

    it('throws error for invalid configuration', () => {
      const invalidConfig = { ...validConfig, url: '' };
      
      expect(() => {
        webhookService.registerWebhook('test-hook', invalidConfig);
      }).toThrow('Invalid webhook configuration');
    });

    it('updates existing webhook configuration', () => {
      webhookService.registerWebhook('test-hook', validConfig);
      
      const updates = {
        url: 'https://new-url.com/webhook',
        enabled: false
      };
      
      webhookService.updateWebhookConfig('test-hook', updates);
      
      const config = webhookService.getWebhookConfig('test-hook');
      expect(config?.url).toBe(updates.url);
      expect(config?.enabled).toBe(updates.enabled);
      
      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        'webhook_updated',
        expect.any(Object)
      );
    });
  });

  describe('Webhook Triggering', () => {
    const mockPayload = {
      data: { test: true },
      eventType: 'song.requested' as const
    };

    beforeEach(() => {
      webhookService.registerWebhook('test-hook', {
        url: 'https://test.com/webhook',
        secret: 'test-secret',
        events: ['song.requested'],
        rateLimit: {
          maxRequests: 2,
          windowMs: 1000
        }
      });
    });

    it('successfully triggers webhook', async () => {
      mockHttpsCallable.mockResolvedValueOnce({ data: { success: true } });

      await webhookService.triggerWebhook(
        'test-hook',
        'song.requested',
        mockPayload.data
      );

      expect(mockHttpsCallable).toHaveBeenCalledWith(expect.objectContaining({
        url: expect.any(String),
        payload: expect.objectContaining({
          eventType: 'song.requested',
          data: mockPayload.data
        })
      }));

      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        'webhook_delivered',
        expect.any(Object)
      );
    });

    it('respects rate limits', async () => {
      mockHttpsCallable.mockResolvedValue({ data: { success: true } });

      // First two requests should succeed
      await webhookService.triggerWebhook('test-hook', 'song.requested', mockPayload.data);
      await webhookService.triggerWebhook('test-hook', 'song.requested', mockPayload.data);

      // Third request should fail due to rate limit
      await expect(
        webhookService.triggerWebhook('test-hook', 'song.requested', mockPayload.data)
      ).rejects.toThrow('Rate limit exceeded');
    });

    it('handles webhook delivery failure with retries', async () => {
      mockHttpsCallable
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ data: { success: true } });

      await webhookService.triggerWebhook(
        'test-hook',
        'song.requested',
        mockPayload.data
      );

      expect(mockHttpsCallable).toHaveBeenCalledTimes(2);
      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        'webhook_delivery_failed',
        expect.any(Object)
      );
      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        'webhook_delivered',
        expect.any(Object)
      );
    });

    it('prevents duplicate deliveries', async () => {
      mockHttpsCallable.mockResolvedValue({ data: { success: true } });

      const deliveryPromises = [
        webhookService.triggerWebhook('test-hook', 'song.requested', mockPayload.data),
        webhookService.triggerWebhook('test-hook', 'song.requested', mockPayload.data)
      ];

      await Promise.all(deliveryPromises);

      expect(mockHttpsCallable).toHaveBeenCalledTimes(1);
      expect(analyticsService.trackEvent).toHaveBeenCalledWith(
        'webhook_duplicate_prevented',
        expect.any(Object)
      );
    });
  });

  describe('Cleanup', () => {
    it('properly cleans up resources', () => {
      const mockCache = {
        clear: vi.fn()
      };

      (Cache as jest.Mock).mockImplementation(() => mockCache);
      
      const service = new WebhookService();
      service.cleanup();

      expect(mockCache.clear).toHaveBeenCalled();
    });
  });

  afterEach(() => {
    webhookService.cleanup();
  });
}); 