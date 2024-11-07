# OneSong Webhook Troubleshooting Guide

## Common Issues

### 1. Signature Verification Failed
```typescript
// Problem: Invalid signature in webhook requests
// Solution: Verify your secret key and signature calculation

// Correct implementation:
const signature = generateSignature(payload, webhookSecret);
if (signature !== receivedSignature) {
  return res.status(401).send('Invalid signature');
}
```

### 2. Rate Limit Exceeded
```typescript
// Problem: Too many requests in time window
// Solution: Implement rate limiting or request batching

// Check current rate limit status:
const status = webhookService.getRateLimitStatus('my-webhook');
console.log(`Remaining requests: ${status.remaining}`);
```

### 3. Webhook Timeouts
- Ensure response within 10 seconds
- Implement async processing
- Use webhook queues for long operations

### 4. Failed Deliveries
Common causes:
1. Network issues
2. Invalid URLs
3. Server errors
4. Rate limiting

Resolution steps:
1. Check webhook logs
2. Verify endpoint availability
3. Review error messages
4. Test endpoint manually

### 5. Missing Events
Checklist:
- [ ] Webhook registered correctly
- [ ] Event types configured
- [ ] Webhook enabled
- [ ] Rate limits appropriate
- [ ] No delivery errors

## Debugging Tools

### 1. Webhook Status Check
```typescript
const status = await webhookService.getWebhookConfig('my-webhook');
console.log('Webhook Status:', status);
```

### 2. Delivery Logs
```typescript
const deliveryLogs = await analyticsService.getWebhookDeliveryLogs({
  webhookId: 'my-webhook',
  startTime: Date.now() - 24 * 60 * 60 * 1000 // Last 24 hours
});
```

### 3. Test Webhook
```typescript
// Send test event
await webhookService.triggerWebhook('my-webhook', 'test.event', {
  message: 'Test delivery'
});
```

## Performance Optimization

### 1. Batching Requests
```typescript
// Instead of individual webhooks:
events.forEach(event => sendWebhook(event));

// Batch events:
sendWebhookBatch(events);
```

### 2. Caching
```typescript
// Cache successful deliveries
const deliveryCache = new Cache({
  maxSize: 1000,
  ttl: 60 * 60 * 1000 // 1 hour
});
```

## Monitoring & Alerts

### 1. Health Metrics
Monitor:
- Delivery success rate
- Response times
- Error rates
- Rate limit usage

### 2. Alert Configuration
```typescript
webhookService.setAlertThresholds({
  errorRate: 0.1, // 10% errors
  responseTime: 1000, // 1 second
  failedDeliveries: 5 // 5 consecutive failures
});
```

## Recovery Procedures

### 1. Manual Retry
```typescript
// Retry failed deliveries
await webhookService.retryFailedDeliveries({
  webhookId: 'my-webhook',
  since: Date.now() - 3600000 // Last hour
});
```

### 2. Reset Rate Limits
```typescript
// Emergency rate limit reset
await webhookService.resetRateLimit('my-webhook');
```

### 3. Webhook Reconfiguration
```typescript
// Update webhook configuration
await webhookService.updateWebhookConfig('my-webhook', {
  url: 'https://new-endpoint.com/webhook',
  enabled: true,
  rateLimit: {
    maxRequests: 200,
    windowMs: 60000
  }
});
```

## Support
For additional assistance:
1. Check webhook status dashboard
2. Review delivery logs
3. Contact support with:
   - Webhook ID
   - Event details
   - Error messages
   - Delivery timestamps 