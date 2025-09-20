#!/bin/bash

# Deploy to production environment
set -e

echo "🚀 Deploying to production environment..."

# Set environment variables for production
export VITE_APP_VERSION=${GITHUB_SHA:-$(git rev-parse HEAD)}
export VITE_ENVIRONMENT="production"

# Build the application for production
echo "📦 Building application for production..."
npm run build

# Deploy to Firebase production
echo "🚀 Deploying to Firebase production..."
firebase use production
firebase deploy --config=firebase.production.json --token="$FIREBASE_TOKEN"

echo "✅ Production deployment complete!"
echo "🌐 Production URL: https://practice-makes-perfect-5e85e.web.app"