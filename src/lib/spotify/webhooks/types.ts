import type { WebhookEventType } from '@/lib/webhooks/types';

export type SpotifyWebhookEventType = 
  | 'spotify.playback.started'
  | 'spotify.playback.ended'
  | 'spotify.auth.linked'
  | 'spotify.auth.revoked';

// Extend existing webhook types
declare module '@/lib/webhooks/types' {
  interface WebhookEventType extends SpotifyWebhookEventType {}
}

export interface SpotifyWebhookPayload {
  eventType: SpotifyWebhookEventType;
  userId: string;
  timestamp: number;
  data: {
    trackId?: string;
    deviceId?: string;
    error?: string;
    authStatus?: 'linked' | 'revoked';
    phoneNumber?: string;
  };
} 