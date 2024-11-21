/**
 * OneSong Webhook System Types
 * Handles payment processing and real-time event notifications
 */

// Base environment and provider types
export type Environment = 'development' | 'staging' | 'production';
export type Provider = 'stripe' | 'wise';

// Comprehensive event type system
export type WebhookEventType =
  // Payment Events
  | 'payment.initiated'
  | 'payment.processing'
  | 'payment.succeeded'
  | 'payment.failed'
  | 'payment.refunded'
  | 'payment.disputed'
  
  // DJ Account Events
  | 'dj.account.created'
  | 'dj.account.verified'
  | 'dj.account.updated'
  | 'dj.payout.initiated'
  | 'dj.payout.completed'
  
  // Request Events
  | 'request.created'
  | 'request.approved'
  | 'request.rejected'
  | 'request.queued'
  
  // Queue Events
  | 'queue.updated'
  | 'queue.song.started'
  | 'queue.song.ended'
  | 'queue.reordered';

// Core webhook payload structure
export interface WebhookPayload<T = any> {
  id: string;
  type: WebhookEventType;
  environment: Environment;
  timestamp: number;
  provider: Provider;
  livemode: boolean;
  data: T;
  metadata?: Record<string, any>;
  version: string;
}

// Security configuration
export interface WebhookSecurity {
  signatureHeader: string;
  signatureAlgorithm: 'sha256' | 'sha512';
  signatureTimeout: number;
  
  rateLimit: {
    windowMs: number;
    maxRequests: number;
    blockDuration: number;
  };
  
  allowedIPs?: string[];
  allowedUserAgents?: string[];
  
  authType: 'bearer' | 'basic' | 'hmac';
  credentials: {
    key?: string;
    secret?: string;
    token?: string;
  };
}

// Error handling system
export class WebhookError extends Error {
  constructor(
    message: string,
    public code: WebhookErrorCode,
    public statusCode: number,
    public metadata: {
      webhookId: string;
      eventType: WebhookEventType;
      timestamp: number;
      attempt: number;
      raw?: any;
    }
  ) {
    super(message);
    this.name = 'WebhookError';
  }

  static validation(message: string, metadata: any): WebhookError {
    return new WebhookError(message, 'INVALID_PAYLOAD', 400, metadata);
  }

  static security(message: string, metadata: any): WebhookError {
    return new WebhookError(message, 'INVALID_SIGNATURE', 401, metadata);
  }
}

export type WebhookErrorCode =
  | 'INVALID_SIGNATURE'
  | 'INVALID_PAYLOAD'
  | 'RATE_LIMITED'
  | 'PROCESSING_FAILED'
  | 'TIMEOUT'
  | 'INVALID_STATE'
  | 'EXTERNAL_SERVICE_ERROR';

// Monitoring and metrics
export interface WebhookMetrics {
  processingTime: {
    average: number;
    p95: number;
    p99: number;
  };
  
  requestCount: {
    total: number;
    success: number;
    failed: number;
    retried: number;
  };
  
  errors: {
    type: WebhookErrorCode;
    count: number;
    lastOccurred: number;
  }[];
  
  health: {
    uptime: number;
    lastDowntime?: number;
    currentStatus: 'healthy' | 'degraded' | 'down';
  };
}

// Retry configuration
export interface WebhookRetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  
  retryableErrors: WebhookErrorCode[];
  retryableHttpCodes: number[];
  
  circuitBreaker: {
    failureThreshold: number;
    resetTimeout: number;
    halfOpenRequests: number;
  };
}

// Validation system
export interface WebhookValidation {
  payloadSchema: Record<string, any>;
  strictValidation: boolean;
  
  rules: {
    type: string;
    condition: string;
    errorMessage: string;
  }[];
  
  customValidators: {
    name: string;
    validator: (payload: any) => boolean | Promise<boolean>;
  }[];
}

// Processing status tracking
export interface WebhookProcessingStatus {
  id: string;
  webhookId: string;
  eventType: WebhookEventType;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';
  attempts: number;
  lastAttempt?: number;
  nextAttempt?: number;
  error?: WebhookError;
  duration?: number;
  metadata?: Record<string, any>;
}

// Response structure
export interface WebhookResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: {
    code: WebhookErrorCode;
    message: string;
    details?: any;
  };
  requestId: string;
  timestamp: number;
  duration: number;
}

// Configuration for webhook endpoints
export interface WebhookConfig {
  id: string;
  url: string;
  provider: Provider;
  active: boolean;
  events: WebhookEventType[];
  secret: string;
  metadata?: Record<string, any>;
  createdAt: number;
  updatedAt: number;
  version: number;
  retryConfig: WebhookRetryConfig;
  securityConfig: WebhookSecurity;
  validation: WebhookValidation;
}

// Testing utilities
export interface WebhookTestCase {
  name: string;
  eventType: WebhookEventType;
  payload: any;
  expectedResponse: {
    success: boolean;
    statusCode: number;
    data?: any;
    error?: WebhookError;
  };
  metadata?: Record<string, any>;
}

export interface WebhookDeliveryDetails {
  webhookId: string;
  success: boolean;
  duration: number;
  attempt: number;
  error?: string;
  payload?: WebhookPayload;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  blockDuration: number;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  halfOpenRequests: number;
}