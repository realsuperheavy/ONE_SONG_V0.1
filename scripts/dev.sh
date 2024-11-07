#!/bin/bash

# Start Firebase emulators
echo "Starting Firebase emulators..."
firebase emulators:start --only functions,firestore,auth &

# Wait for emulators to start
sleep 5

# Start Next.js development server
echo "Starting Next.js development server..."
npm run dev