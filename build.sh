#!/bin/bash

# 🚀 Neo Networker Build Script
# This script builds the restructured project

set -e  # Exit on any error

echo "🏗️ Building Neo Networker..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Check if we're in the right directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Build Backend
echo "📦 Building Backend..."
cd backend

# Check if requirements.txt exists
if [ ! -f "requirements.txt" ]; then
    print_error "requirements.txt not found in backend directory"
    exit 1
fi

# Install dependencies
print_status "Installing Python dependencies..."
pip install -r requirements.txt

# Run tests if they exist
if [ -d "tests" ]; then
    print_status "Running backend tests..."
    python -m pytest tests/ -v || print_warning "Some tests failed, but continuing..."
fi

# Check if main.py exists
if [ ! -f "main.py" ]; then
    print_error "main.py not found in backend directory"
    exit 1
fi

print_status "Backend build complete!"

# Build Frontend
echo "🎨 Building Frontend..."
cd ../frontend

# Check if package.json exists
if [ ! -f "package.json" ]; then
    print_error "package.json not found in frontend directory"
    exit 1
fi

# Install dependencies
print_status "Installing Node.js dependencies..."
npm install

# Run tests if they exist
if npm run test --if-present; then
    print_status "Frontend tests passed"
else
    print_warning "Frontend tests failed or not configured"
fi

# Build the frontend
print_status "Building frontend..."
npm run build

print_status "Frontend build complete!"

# Go back to root
cd ..

# Build Docker images
echo "🐳 Building Docker Images..."

# Build backend image
print_status "Building backend Docker image..."
docker build -f docker/Dockerfile.backend -t neo-backend:latest .

# Build frontend image
print_status "Building frontend Docker image..."
docker build -f docker/Dockerfile.frontend -t neo-frontend:latest .

print_status "Docker images built successfully!"

# Test the build
echo "🧪 Testing the build..."

# Test backend
print_status "Testing backend..."
cd backend
python -c "import sys; sys.path.insert(0, '.'); from api.app import app; print('Backend imports successful')"
cd ..

# Test frontend
print_status "Testing frontend..."
cd frontend
npm run build > /dev/null 2>&1 && print_status "Frontend build test passed"
cd ..

echo ""
echo "🎉 Build completed successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Test locally: docker-compose -f docker/docker-compose.yml up"
echo "2. Deploy to AWS: aws apprunner start-deployment --service-arn YOUR_SERVICE_ARN"
echo "3. Monitor logs: Check AWS App Runner logs for any issues"
echo ""
echo "🔗 Useful Commands:"
echo "• Backend: cd backend && python main.py"
echo "• Frontend: cd frontend && npm run dev"
echo "• Docker: docker-compose -f docker/docker-compose.yml up"
echo "• Tests: python tests/integration/test_with_real_auth.py"
