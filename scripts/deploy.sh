#!/bin/bash

# Build the Next.js application
echo "Building application..."
npm run build

# Build Firebase Functions
echo "Building Firebase Functions..."
cd functions && npm run build && cd ..

# Deploy to Firebase
echo "Deploying to Firebase..."
firebase deploy --only hosting,functions

# Notify monitoring
curl -X POST $MONITORING_WEBHOOK -H "Content-Type: application/json" \
  -d '{"event": "deployment", "environment": "production", "status": "completed"}' 