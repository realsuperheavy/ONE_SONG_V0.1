#!/bin/bash

# Build the application
echo "Building application..."
npm run build

# Run tests
echo "Running tests..."
npm test

# Deploy to Firebase
echo "Deploying to Firebase..."
firebase deploy --only hosting

# Notify monitoring
curl -X POST $MONITORING_WEBHOOK -H "Content-Type: application/json" \
  -d '{"event": "deployment", "environment": "production", "status": "completed"}' 