#!/bin/bash
# Deployment Script for Multi-Environment Setup
# Usage: ./deploy.sh [environment] [component]
# Example: ./deploy.sh test backend

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-"test"}
COMPONENT=${2:-"all"}
REGION="us-east-1"
ACCOUNT_ID="587842257084"

# Environment-specific configuration
if [ "$ENVIRONMENT" = "dev" ]; then
    echo -e "${BLUE}🏠 Local Development Environment${NC}"
    echo -e "${YELLOW}Starting local Docker environment...${NC}"
    docker-compose -f docker-compose.local.yml up -d
    echo -e "${GREEN}✅ Local development environment started${NC}"
    exit 0
    
elif [ "$ENVIRONMENT" = "test" ]; then
    DB_INSTANCE_ID="neo-networker-db-test"
    APP_RUNNER_SERVICE="neo-networker-backend-test"
    S3_BUCKET="neo-networker-frontend-test"
    CLOUDFRONT_DISTRIBUTION="neo-networker-frontend-test-cdn"
    ECR_REPO="587842257084.dkr.ecr.us-east-1.amazonaws.com/repo:test"
    
elif [ "$ENVIRONMENT" = "prod" ]; then
    DB_INSTANCE_ID="neo-networker-db-v2"
    APP_RUNNER_SERVICE="neo-networker-backend-final"
    S3_BUCKET="neo-networker-frontend-1758372954"
    CLOUDFRONT_DISTRIBUTION="E2EFFEJ56BYWCG"
    ECR_REPO="587842257084.dkr.ecr.us-east-1.amazonaws.com/repo:latest"
    
else
    echo -e "${RED}❌ Invalid environment. Use 'dev', 'test', or 'prod'${NC}"
    exit 1
fi

echo -e "${BLUE}🚀 Deploying to ${ENVIRONMENT} environment${NC}"

# Function to deploy backend
deploy_backend() {
    echo -e "${BLUE}🔧 Deploying backend to ${ENVIRONMENT}...${NC}"
    
    # Build Docker image
    echo -e "${YELLOW}📦 Building Docker image...${NC}"
    docker build -t neo-networker-backend -f Dockerfile .
    
    # Tag for ECR
    docker tag neo-networker-backend:latest ${ECR_REPO}
    
    # Login to ECR
    aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com
    
    # Push to ECR
    echo -e "${YELLOW}📤 Pushing to ECR...${NC}"
    docker push ${ECR_REPO}
    
    # Deploy to App Runner
    echo -e "${YELLOW}🚀 Deploying to App Runner...${NC}"
    aws apprunner start-deployment --service-arn arn:aws:apprunner:${REGION}:${ACCOUNT_ID}:service/${APP_RUNNER_SERVICE}/$(aws apprunner list-services --query "ServiceSummaryList[?ServiceName=='${APP_RUNNER_SERVICE}'].ServiceArn" --output text | cut -d'/' -f2)
    
    echo -e "${GREEN}✅ Backend deployed to ${ENVIRONMENT}${NC}"
}

# Function to deploy frontend
deploy_frontend() {
    echo -e "${BLUE}🎨 Deploying frontend to ${ENVIRONMENT}...${NC}"
    
    # Set environment-specific API URL
    if [ "$ENVIRONMENT" = "test" ]; then
        API_URL="https://${APP_RUNNER_SERVICE}.us-east-1.awsapprunner.com/api"
    elif [ "$ENVIRONMENT" = "prod" ]; then
        API_URL="https://api.leeeed.com/api"
    fi
    
    # Update environment file
    echo "VITE_API_URL=${API_URL}" > frontend/.env.${ENVIRONMENT}
    
    # Build frontend
    echo -e "${YELLOW}📦 Building frontend...${NC}"
    cd frontend
    npm run build
    
    # Upload to S3
    echo -e "${YELLOW}📤 Uploading to S3...${NC}"
    aws s3 sync dist/ s3://${S3_BUCKET} --delete
    
    # Invalidate CloudFront cache
    echo -e "${YELLOW}🔄 Invalidating CloudFront cache...${NC}"
    aws cloudfront create-invalidation --distribution-id ${CLOUDFRONT_DISTRIBUTION} --paths "/*"
    
    cd ..
    echo -e "${GREEN}✅ Frontend deployed to ${ENVIRONMENT}${NC}"
}

# Function to run database migrations
run_migrations() {
    echo -e "${BLUE}🗄️  Running database migrations for ${ENVIRONMENT}...${NC}"
    
    if [ "$ENVIRONMENT" = "test" ]; then
        # Get test database endpoint
        RDS_ENDPOINT=$(aws rds describe-db-instances --db-instance-identifier ${DB_INSTANCE_ID} --query 'DBInstances[0].Endpoint.Address' --output text)
        
        # Run migrations on test database
        PGPASSWORD="TestPassword123!" psql -h ${RDS_ENDPOINT} -U postgres -d postgres -f production_migration.sql
        PGPASSWORD="TestPassword123!" psql -h ${RDS_ENDPOINT} -U postgres -d postgres -f google_scopes_migration.sql
        
    elif [ "$ENVIRONMENT" = "prod" ]; then
        echo -e "${YELLOW}⚠️  Production migrations should be run manually for safety${NC}"
        echo -e "${BLUE}📋 Run these commands on your production database:${NC}"
        echo "  psql -h neo-networker-db-v2.c0d2k4qwgenr.us-east-1.rds.amazonaws.com -U postgres -d postgres -f production_migration.sql"
        echo "  psql -h neo-networker-db-v2.c0d2k4qwgenr.us-east-1.rds.amazonaws.com -U postgres -d postgres -f google_scopes_migration.sql"
    fi
    
    echo -e "${GREEN}✅ Database migrations completed for ${ENVIRONMENT}${NC}"
}

# Main deployment logic
case $COMPONENT in
    "backend")
        deploy_backend
        ;;
    "frontend")
        deploy_frontend
        ;;
    "migrations")
        run_migrations
        ;;
    "all")
        deploy_backend
        deploy_frontend
        run_migrations
        ;;
    *)
        echo -e "${RED}❌ Invalid component. Use 'backend', 'frontend', 'migrations', or 'all'${NC}"
        exit 1
        ;;
esac

echo -e "${GREEN}🎉 Deployment to ${ENVIRONMENT} completed!${NC}"

# Show environment URLs
if [ "$ENVIRONMENT" = "test" ]; then
    echo -e "${BLUE}📋 Test Environment URLs:${NC}"
    echo "  Frontend: https://${CLOUDFRONT_DISTRIBUTION}.cloudfront.net"
    echo "  Backend: https://${APP_RUNNER_SERVICE}.us-east-1.awsapprunner.com"
    echo "  Database: ${DB_INSTANCE_ID}"
    
elif [ "$ENVIRONMENT" = "prod" ]; then
    echo -e "${BLUE}📋 Production Environment URLs:${NC}"
    echo "  Frontend: https://d2fq8k5py78ii.cloudfront.net"
    echo "  Backend: https://dkdrn34xpx.us-east-1.awsapprunner.com"
    echo "  Database: ${DB_INSTANCE_ID}"
fi