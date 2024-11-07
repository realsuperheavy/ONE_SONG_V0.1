# OneSong Webhook API Documentation

## Overview
The OneSong Webhook API enables real-time event notifications for your application. Events are delivered as HTTP POST requests with signed payloads.

## Authentication
All webhook requests include an HMAC SHA-256 signature in the `x-onesong-signature` header:

```typescript
const isValid = verifySignature(payload, signature, secret);
```

## Events
| Event Type | Description | Payload | Retry Policy |
|------------|-------------|---------|--------------|
| song.requested | New song request | `{ requestId: string, song: Song, userId: string, timestamp: number }` | 3x with backoff |
| song.approved | Request approved | `{ requestId: string, song: Song, approvedBy: string, timestamp: number }` | 3x with backoff |
| song.rejected | Request rejected | `{ requestId: string, reason?: string, rejectedBy: string, timestamp: number }` | 3x with backoff |
| song.played | Song played | `{ requestId: string, playedAt: number, duration: number }` | 3x with backoff |
| queue.updated | Queue changed | `{ queueItems: QueueItem[], eventId: string, timestamp: number }` | 3x with backoff |
| event.started | Event started | `{ eventId: string, startedAt: number, djId: string }` | 3x with backoff |
| event.ended | Event ended | `{ eventId: string, endedAt: number, djId: string }` | 3x with backoff |
| tip.received | Tip received | `{ requestId: string, amount: number, userId: string, timestamp: number }` | 3x with backoff |

## Rate Limiting
- Default: 100 requests per minute
- Configurable per webhook
- Status codes:
  - 429: Rate limit exceeded
  - 200: Success
  - 500: Server error

## Example Implementation
```typescript
const express = require('express');
const app = express();

app.post('/webhook', (req, res) => {
  const signature = req.headers['x-onesong-signature'];
  const isValid = verifySignature(req.body, signature, WEBHOOK_SECRET);
  
  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }
  
  // Handle webhook event
  const { type, payload } = req.body;
  console.log(`Received ${type} event:`, payload);
  
  res.status(200).send('OK');
});
``` 