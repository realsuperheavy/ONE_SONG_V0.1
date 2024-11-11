import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SpotifyWebhookHandler } from '../handler';
import { WebhookService } from '@/lib/webhooks/service';
import { spotifyAuthService } from '../../services/auth';
import { analyticsService } from '@/lib/firebase/services/analytics';
import { AppError } from '@/lib/error/AppError';

vi.mock('@/lib/webhooks/service');
vi.mock('../../services/auth');
vi.mock('@/lib/firebase/services/analytics');

describe('SpotifyWebhookHandler', () => {
  let handler: SpotifyWebhookHandler;

  beforeEach(() => {
    handler = new SpotifyWebhookHandler();
  });

  it('handles auth linked events with phone number', async () => {
    const payload = {
      eventType: 'spotify.auth.linked' as const,
      userId: 'test-user',
      timestamp: Date.now(),
      data: {
        phoneNumber: '+11234567890'
      }
    };

    await handler.handleWebhook('test-webhook', payload);

    expect(spotifyAuthService.linkPhoneNumber)
      .toHaveBeenCalledWith('test-user', '+11234567890');
    expect(analyticsService.trackEvent)
      .toHaveBeenCalledWith('spotify_webhook_handled', expect.any(Object));
  });

  it('handles auth revoked events', async () => {
    const payload = {
      eventType: 'spotify.auth.revoked' as const,
      userId: 'test-user',
      timestamp: Date.now(),
      data: {}
    };

    await handler.handleWebhook('test-webhook', payload);

    expect(spotifyAuthService.revokeAccess)
      .toHaveBeenCalledWith('test-user');
  });

  it('forwards playback events to webhook service', async () => {
    const payload = {
      eventType: 'spotify.playback.started' as const,
      userId: 'test-user',
      timestamp: Date.now(),
      data: {
        trackId: 'test-track',
        deviceId: 'test-device'
      }
    };

    await handler.handleWebhook('test-webhook', payload);

    expect(WebhookService.prototype.deliverWebhook)
      .toHaveBeenCalledWith('test-webhook', expect.objectContaining({
        eventType: payload.eventType,
        data: payload.data
      }));
  });

  it('throws error for unsupported event types', async () => {
    const payload = {
      eventType: 'unsupported' as any,
      userId: 'test-user',
      timestamp: Date.now(),
      data: {}
    };

    await expect(handler.handleWebhook('test-webhook', payload))
      .rejects.toThrow(AppError);
  });
}); 