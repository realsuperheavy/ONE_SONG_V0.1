export class WebhookError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
    public readonly metadata: Record<string, any> = {}
  ) {
    super(message);
    this.name = 'WebhookError';
    Error.captureStackTrace(this, WebhookError);
  }

  static validation(message: string, metadata?: Record<string, any>): WebhookError {
    return new WebhookError(message, 'VALIDATION_ERROR', 400, metadata);
  }

  static security(message: string, metadata?: Record<string, any>): WebhookError {
    return new WebhookError(message, 'SECURITY_ERROR', 403, metadata);
  }
} 