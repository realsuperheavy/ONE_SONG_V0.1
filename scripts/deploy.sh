#!/bin/bash

# Clean previous builds
rm -rf .next out

# Build the Next.js application
echo "Building application..."
npm run build

# Verify out directory exists
if [ ! -d "out" ]; then
  echo "Error: 'out' directory not found after build"
  exit 1
fi

# Deploy to Firebase
echo "Deploying to Firebase..."
firebase deploy --only hosting

# Notify monitoring
if [ -n "$MONITORING_WEBHOOK" ]; then
  curl -X POST $MONITORING_WEBHOOK -H "Content-Type: application/json" \
    -d '{"event": "deployment", "environment": "production", "status": "completed"}'
fi 