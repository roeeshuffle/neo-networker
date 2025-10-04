#!/bin/bash

# Frontend Test Runner Script
# This script runs the frontend test suite with proper configuration

set -e  # Exit on any error

echo "🧪 Starting Frontend Test Suite"
echo "================================"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if Jest is installed
if ! command -v npx jest &> /dev/null; then
    echo "❌ Jest not found. Installing test dependencies..."
    npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event ts-jest jest-environment-jsdom @types/jest identity-obj-proxy
fi

# Set environment variables for testing
export NODE_ENV=test
export VITE_API_URL=https://dkdrn34xpx.us-east-1.awsapprunner.com

echo "🔧 Test Configuration:"
echo "  - Environment: $NODE_ENV"
echo "  - API URL: $VITE_API_URL"
echo "  - Jest Config: jest.config.js"
echo ""

# Run tests based on argument
case "${1:-all}" in
    "unit")
        echo "🔬 Running Unit Tests..."
        npx jest --testPathPattern="api.test.ts|components.test.tsx" --coverage
        ;;
    "integration")
        echo "🔗 Running Integration Tests..."
        npx jest --testPathPattern="csv-import.test.tsx|custom-fields.test.tsx" --coverage
        ;;
    "e2e")
        echo "🌐 Running End-to-End Tests..."
        npx jest --testPathPattern="e2e.test.tsx" --coverage
        ;;
    "watch")
        echo "👀 Running Tests in Watch Mode..."
        npx jest --watch
        ;;
    "ci")
        echo "🤖 Running Tests for CI..."
        npx jest --ci --coverage --watchAll=false --maxWorkers=2
        ;;
    "all"|*)
        echo "🚀 Running All Tests..."
        npx jest --coverage
        ;;
esac

# Check test results
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All tests passed!"
    echo "📊 Coverage report generated in coverage/"
    
    # Check coverage thresholds
    if [ -f "coverage/lcov-report/index.html" ]; then
        echo "📈 Coverage report available at: coverage/lcov-report/index.html"
    fi
else
    echo ""
    echo "❌ Some tests failed!"
    exit 1
fi

echo ""
echo "🎉 Test suite completed successfully!"
