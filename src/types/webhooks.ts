export type WebhookEventType = 
  | 'song.requested'
  | 'song.approved'
  | 'song.rejected'
  | 'song.played'
  | 'queue.updated'
  | 'event.started'
  | 'event.ended'
  | 'tip.received'
  | 'user.joined'
  | 'user.left';

export interface WebhookEventPayload {
  song: {
    requested: {
      songId: string;
      userId: string;
      eventId: string;
      timestamp: number;
      message?: string;
    };
    approved: {
      songId: string;
      requestId: string;
      djId: string;
      timestamp: number;
    };
    rejected: {
      songId: string;
      requestId: string;
      djId: string;
      reason?: string;
      timestamp: number;
    };
    played: {
      songId: string;
      requestId: string;
      playDuration: number;
      timestamp: number;
    };
  };
  queue: {
    updated: {
      eventId: string;
      queueSize: number;
      changes: Array<{
        type: 'added' | 'removed' | 'reordered';
        songId: string;
        position?: number;
      }>;
      timestamp: number;
    };
  };
  event: {
    started: {
      eventId: string;
      djId: string;
      timestamp: number;
      details: {
        name: string;
        venue?: string;
        type: string;
      };
    };
    ended: {
      eventId: string;
      djId: string;
      timestamp: number;
      stats: {
        duration: number;
        totalRequests: number;
        totalTips: number;
      };
    };
  };
  tip: {
    received: {
      amount: number;
      currency: string;
      userId: string;
      requestId?: string;
      eventId: string;
      timestamp: number;
    };
  };
  user: {
    joined: {
      userId: string;
      eventId: string;
      timestamp: number;
      userType: 'dj' | 'attendee';
    };
    left: {
      userId: string;
      eventId: string;
      timestamp: number;
      duration: number;
    };
  };
}

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  secret: string;
  enabled: boolean;
  events: WebhookEventType[];
  createdAt: number;
  updatedAt: number;
  rateLimit: {
    maxRequests: number;
    windowMs: number;
  };
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  eventType: WebhookEventType;
  payload: any;
  status: 'success' | 'failed';
  statusCode?: number;
  error?: string;
  duration: number;
  timestamp: number;
} 