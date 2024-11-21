# OneSong Deployment Guide

## 1. Environment Setup

### Production Environment Requirements
```bash
# Hardware Requirements
CPU: 4+ cores
RAM: 16GB minimum
Storage: 100GB SSD

# Software Requirements
Node.js: v18.x
Redis: v6.x
Firebase Tools: Latest
```

### Environment Variables
```env
# Core Configuration
NODE_ENV=production
APP_URL=https://onesong.app
API_URL=https://api.onesong.app

# Firebase
FIREBASE_PROJECT_ID=onesong-prod
FIREBASE_PRIVATE_KEY=xxx
FIREBASE_CLIENT_EMAIL=xxx

# External Services
SPOTIFY_CLIENT_ID=xxx
SPOTIFY_CLIENT_SECRET=xxx
STRIPE_SECRET_KEY=xxx
STRIPE_WEBHOOK_SECRET=xxx
```

## 2. Deployment Process

### Zero-Downtime Deployment
```bash
# 1. Health Check Current Version
./scripts/health-check.sh

# 2. Deploy New Version
npm run deploy:prepare
npm run deploy:migrate
npm run deploy:release

# 3. Verify Deployment
./scripts/verify-deployment.sh

# 4. Rollback if Needed
./scripts/rollback.sh
```

### Database Migrations
```sql
-- Example migration
BEGIN TRANSACTION;

-- Add new fields
ALTER TABLE events ADD COLUMN settings jsonb;

-- Migrate existing data
UPDATE events 
SET settings = json_build_object(
    'allowRequests', true,
    'requireApproval', false
);

COMMIT;
``` 