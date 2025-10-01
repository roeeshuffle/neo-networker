#!/bin/bash

# 🚀 Neo Networker Deployment Script
# This script deploys the restructured project to AWS App Runner

set -e  # Exit on any error

echo "🚀 Deploying Neo Networker..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Check AWS credentials
print_info "Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

print_status "AWS credentials verified"

# Check if APP_RUNNER_SERVICE_ARN is set
if [ -z "$APP_RUNNER_SERVICE_ARN" ]; then
    print_warning "APP_RUNNER_SERVICE_ARN environment variable not set"
    print_info "Please set it with: export APP_RUNNER_SERVICE_ARN=your-service-arn"
    read -p "Enter your App Runner Service ARN: " APP_RUNNER_SERVICE_ARN
fi

# Build the project first
print_info "Building project before deployment..."
./build.sh

# Deploy to AWS App Runner
print_info "Deploying to AWS App Runner..."
print_info "Service ARN: $APP_RUNNER_SERVICE_ARN"

# Start deployment
print_status "Starting deployment..."
aws apprunner start-deployment --service-arn "$APP_RUNNER_SERVICE_ARN"

if [ $? -eq 0 ]; then
    print_status "Deployment started successfully!"
    
    # Get service info
    print_info "Getting service information..."
    SERVICE_URL=$(aws apprunner describe-service --service-arn "$APP_RUNNER_SERVICE_ARN" --query 'Service.ServiceUrl' --output text)
    
    echo ""
    echo "🎉 Deployment initiated successfully!"
    echo ""
    echo "📋 Service Information:"
    echo "• Service ARN: $APP_RUNNER_SERVICE_ARN"
    echo "• Service URL: $SERVICE_URL"
    echo ""
    echo "🔍 Monitoring:"
    echo "• Check deployment status: aws apprunner describe-service --service-arn $APP_RUNNER_SERVICE_ARN"
    echo "• View logs: aws logs describe-log-groups --log-group-name-prefix /aws/apprunner"
    echo ""
    echo "🧪 Testing:"
    echo "• Health check: curl $SERVICE_URL/api/health"
    echo "• Test APIs: python tests/integration/test_with_real_auth.py"
    echo ""
    echo "⏱️  Deployment typically takes 2-5 minutes to complete."
    
else
    print_error "Deployment failed!"
    exit 1
fi
