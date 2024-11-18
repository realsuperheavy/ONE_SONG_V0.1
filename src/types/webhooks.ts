// This file should be deleted as it's now moved to src/lib/webhooks/types.ts

export type WebhookEventType = 'event_created' | 'event_updated' | 'event_deleted' | 'request_received' | 'request_updated';

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

export interface WebhookDeliveryStatus {
  success: boolean;
  statusCode?: number;
  error?: string;
  duration: number;
  timestamp: number;
}

export interface WebhookMetrics {
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  averageResponseTime: number;
}