# OneSong Webhook Setup Guide

## Quick Start
1. Register a webhook
2. Configure event types
3. Set up authentication
4. Handle webhook deliveries

## Detailed Setup

### 1. Register Your Webhook
```typescript
const webhookService = new WebhookService();

webhookService.registerWebhook('my-webhook', {
  url: 'https://api.example.com/webhook',
  secret: 'your-secret-key',
  events: ['song.requested', 'song.played'],
  rateLimit: {
    maxRequests: 100,
    windowMs: 60000 // 1 minute
  }
});
```

### 2. Verify Webhook Signatures
Each webhook delivery includes a signature header:
```typescript
const isValid = verifySignature(
  payload,
  request.headers['x-onesong-signature'],
  WEBHOOK_SECRET
);
```

### 3. Handle Rate Limits
- Default: 100 requests per minute
- Increase limits for high-traffic scenarios:
```typescript
webhookService.updateWebhookConfig('my-webhook', {
  rateLimit: {
    maxRequests: 1000,
    windowMs: 60000
  }
});
```

### 4. Configure Retry Logic
- Automatic retries on failure
- Maximum 3 retry attempts
- Exponential backoff

## Best Practices
1. Store webhook secrets securely
2. Implement timeout handling
3. Process webhooks asynchronously
4. Maintain idempotency
5. Monitor webhook health

## Environment Setup
```bash
# Required environment variables
WEBHOOK_SECRET=your-secret-key
WEBHOOK_URL=https://api.example.com/webhook

# Optional configuration
MAX_REQUESTS=100
WINDOW_MS=60000
``` 