#!/bin/bash

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "Firebase CLI is not installed. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Start Firebase emulators
echo "Starting Firebase emulators..."
firebase emulators:start --only functions,firestore,auth &

# Wait for emulators to start
sleep 5

# Start Next.js development server
echo "Starting Next.js development server..."
npm run dev