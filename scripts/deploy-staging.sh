#!/bin/bash

# Deploy to staging environment
set -e

echo "🚀 Deploying to staging environment..."

# Set environment variables for staging
export VITE_APP_VERSION=${GITHUB_SHA:-$(git rev-parse HEAD)}
export VITE_ENVIRONMENT="staging"

# Build the application for staging
echo "📦 Building application for staging..."
npm run build

# Deploy to Firebase staging
echo "🚀 Deploying to Firebase staging..."
firebase use staging
firebase deploy --config=firebase.staging.json --token="$FIREBASE_TOKEN"

echo "✅ Staging deployment complete!"
echo "🌐 Staging URL: https://practice-makes-perfect-staging.web.app"