#!/bin/bash

# Frontend Deployment with Tests
# This script runs tests before deploying the frontend

set -e  # Exit on any error

echo "🚀 Frontend Deployment with Tests"
echo "================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run from frontend directory."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run linting
echo "🔍 Running ESLint..."
npm run lint

# Run type checking
echo "🔧 Running TypeScript type checking..."
npx tsc --noEmit

# Run tests
echo "🧪 Running test suite..."
npm run test:ci

# Check if tests passed
if [ $? -eq 0 ]; then
    echo "✅ All tests passed!"
else
    echo "❌ Tests failed! Deployment aborted."
    exit 1
fi

# Build the application
echo "🏗️  Building application..."
npm run build

# Check if build succeeded
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed! Deployment aborted."
    exit 1
fi

# Deploy to S3 (if AWS CLI is configured)
if command -v aws &> /dev/null; then
    echo "☁️  Deploying to AWS S3..."
    
    # Check if S3 bucket is configured
    if [ -n "$S3_BUCKET" ]; then
        aws s3 sync dist/ s3://$S3_BUCKET --delete
        echo "✅ Deployed to S3 bucket: $S3_BUCKET"
        
        # Invalidate CloudFront cache if distribution ID is provided
        if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
            echo "🔄 Invalidating CloudFront cache..."
            aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/*"
            echo "✅ CloudFront cache invalidated"
        fi
    else
        echo "⚠️  S3_BUCKET environment variable not set. Skipping S3 deployment."
    fi
else
    echo "⚠️  AWS CLI not found. Skipping S3 deployment."
fi

echo ""
echo "🎉 Frontend deployment completed successfully!"
echo "📊 Test coverage report available in coverage/"
echo "📈 Build artifacts available in dist/"
