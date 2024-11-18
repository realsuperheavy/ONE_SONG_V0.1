export type WebhookEventType = 
  | 'event_created'
  | 'event_updated'
  | 'event_deleted'
  | 'request_received'
  | 'request_updated';

export interface WebhookConfig {
  id: string;
  url: string;
  secret: string;
  events: WebhookEventType[];
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface WebhookEventPayload {
  eventType: WebhookEventType;
  data: unknown;
  timestamp: number;
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