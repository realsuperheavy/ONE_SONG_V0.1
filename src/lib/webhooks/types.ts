export type WebhookEventType = 
  | 'song.requested'
  | 'song.approved'
  | 'song.rejected'
  | 'event.started'
  | 'event.ended'
  | 'user.joined';

export interface WebhookConfig {
  id: string;
  url: string;
  secret: string;
  enabled: boolean;
  events: WebhookEventType[];
  timeout?: number;
  retryCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookPayload {
  eventType: WebhookEventType;
  timestamp: number;
  data: unknown;
  signature: string;
}

export interface WebhookLogEntry {
  webhookId: string;
  success: boolean;
  statusCode?: number;
  error?: string;
  attempt: number;
  timestamp: Date;
}