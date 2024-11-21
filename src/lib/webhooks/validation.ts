interface WebhookConfig {
  id: string;
  secret: string;
  securityConfig: {
    signatureTimeout: number;
    requiredFields: string[];
  };
}

interface WebhookPayload {
  timestamp: number;
  signature: string;
  data: Record<string, any>;
}

export class WebhookError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'WebhookError';
  }

  static validation(message: string, details?: Record<string, any>): WebhookError {
    return new WebhookError(message, 'VALIDATION_ERROR', details);
  }

  static security(message: string, details?: Record<string, any>): WebhookError {
    return new WebhookError(message, 'SECURITY_ERROR', details);
  }
}

export class WebhookValidator {
  async validatePayload(webhook: WebhookConfig, payload: WebhookPayload): Promise<void> {
    // Add comprehensive validation
    await Promise.all([
      this.validateSchema(webhook, payload),
      this.validateSignature(webhook, payload),
      this.validateTiming(webhook, payload),
      this.validateCustomRules(webhook, payload)
    ]);
  }

  private async validateTiming(webhook: WebhookConfig, payload: WebhookPayload): Promise<void> {
    const now = Date.now();
    const payloadAge = now - payload.timestamp;
    
    if (payloadAge > webhook.securityConfig.signatureTimeout) {
      throw WebhookError.validation('Webhook payload has expired', {
        age: payloadAge,
        maxAge: webhook.securityConfig.signatureTimeout
      });
    }
  }

  private async validateSignature(webhook: WebhookConfig, payload: WebhookPayload): Promise<void> {
    const expectedSignature = this.generateSignature(payload, webhook.secret);
    const receivedSignature = payload.signature;

    if (!this.compareSignatures(expectedSignature, receivedSignature)) {
      throw WebhookError.security('Invalid webhook signature', {
        webhookId: webhook.id
      });
    }
  }
} 