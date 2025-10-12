#!/bin/bash
# Multi-Environment Setup Script
# This script sets up separate AWS environments for dev/test/prod

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Environment configuration
ENVIRONMENT=${1:-"test"}
REGION="us-east-1"
ACCOUNT_ID="587842257084"

echo -e "${BLUE}🚀 Setting up ${ENVIRONMENT} environment${NC}"

if [ "$ENVIRONMENT" = "test" ]; then
    # Test environment configuration
    DB_INSTANCE_ID="neo-networker-db-test"
    APP_RUNNER_SERVICE="neo-networker-backend-test"
    S3_BUCKET="neo-networker-frontend-test"
    CLOUDFRONT_DISTRIBUTION="neo-networker-frontend-test-cdn"
    
    echo -e "${YELLOW}📋 Test Environment Configuration:${NC}"
    echo "  Database: ${DB_INSTANCE_ID}"
    echo "  App Runner: ${APP_RUNNER_SERVICE}"
    echo "  S3 Bucket: ${S3_BUCKET}"
    echo "  CloudFront: ${CLOUDFRONT_DISTRIBUTION}"
    
elif [ "$ENVIRONMENT" = "prod" ]; then
    # Production environment (existing)
    DB_INSTANCE_ID="neo-networker-db-v2"
    APP_RUNNER_SERVICE="neo-networker-backend-final"
    S3_BUCKET="neo-networker-frontend-1758372954"
    CLOUDFRONT_DISTRIBUTION="E2EFFEJ56BYWCG"
    
    echo -e "${RED}⚠️  Production Environment (Existing)${NC}"
    echo "  Database: ${DB_INSTANCE_ID}"
    echo "  App Runner: ${APP_RUNNER_SERVICE}"
    echo "  S3 Bucket: ${S3_BUCKET}"
    echo "  CloudFront: ${CLOUDFRONT_DISTRIBUTION}"
    
else
    echo -e "${RED}❌ Invalid environment. Use 'test' or 'prod'${NC}"
    exit 1
fi

# Function to create RDS instance
create_rds_instance() {
    echo -e "${BLUE}🗄️  Creating RDS instance: ${DB_INSTANCE_ID}${NC}"
    
    aws rds create-db-instance \
        --db-instance-identifier ${DB_INSTANCE_ID} \
        --db-instance-class db.t3.micro \
        --engine postgres \
        --engine-version 17.4 \
        --master-username postgres \
        --master-user-password "TestPassword123!" \
        --allocated-storage 20 \
        --storage-type gp2 \
        --vpc-security-group-ids sg-0b170ebb412ed8e6c \
        --db-subnet-group-name default \
        --backup-retention-period 7 \
        --no-multi-az \
        --publicly-accessible \
        --storage-encrypted \
        --region ${REGION} \
        --tags Key=Environment,Value=${ENVIRONMENT} Key=Project,Value=neo-networker
    
    echo -e "${GREEN}✅ RDS instance creation initiated${NC}"
    echo -e "${YELLOW}⏳ Wait for RDS instance to be available before proceeding${NC}"
}

# Function to create S3 bucket
create_s3_bucket() {
    echo -e "${BLUE}🪣 Creating S3 bucket: ${S3_BUCKET}${NC}"
    
    aws s3 mb s3://${S3_BUCKET} --region ${REGION}
    
    # Configure bucket for static website hosting
    aws s3 website s3://${S3_BUCKET} \
        --index-document index.html \
        --error-document index.html
    
    # Set bucket policy for CloudFront
    cat > bucket-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowCloudFrontServicePrincipal",
            "Effect": "Allow",
            "Principal": {
                "Service": "cloudfront.amazonaws.com"
            },
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::${S3_BUCKET}/*",
            "Condition": {
                "StringEquals": {
                    "AWS:SourceArn": "arn:aws:cloudfront::${ACCOUNT_ID}:distribution/*"
                }
            }
        }
    ]
}
EOF
    
    aws s3api put-bucket-policy --bucket ${S3_BUCKET} --policy file://bucket-policy.json
    rm bucket-policy.json
    
    echo -e "${GREEN}✅ S3 bucket created and configured${NC}"
}

# Function to create CloudFront distribution
create_cloudfront_distribution() {
    echo -e "${BLUE}🌐 Creating CloudFront distribution${NC}"
    
    # Get S3 bucket domain
    S3_DOMAIN="${S3_BUCKET}.s3.amazonaws.com"
    
    cat > cloudfront-config.json << EOF
{
    "CallerReference": "neo-networker-${ENVIRONMENT}-$(date +%s)",
    "Comment": "Neo Networker ${ENVIRONMENT} Frontend",
    "DefaultRootObject": "index.html",
    "Origins": {
        "Quantity": 1,
        "Items": [
            {
                "Id": "S3-${S3_BUCKET}",
                "DomainName": "${S3_DOMAIN}",
                "S3OriginConfig": {
                    "OriginAccessIdentity": ""
                }
            }
        ]
    },
    "DefaultCacheBehavior": {
        "TargetOriginId": "S3-${S3_BUCKET}",
        "ViewerProtocolPolicy": "redirect-to-https",
        "TrustedSigners": {
            "Enabled": false,
            "Quantity": 0
        },
        "ForwardedValues": {
            "QueryString": false,
            "Cookies": {
                "Forward": "none"
            }
        },
        "MinTTL": 0,
        "DefaultTTL": 86400,
        "MaxTTL": 31536000
    },
    "Enabled": true,
    "PriceClass": "PriceClass_100"
}
EOF
    
    DISTRIBUTION_ID=$(aws cloudfront create-distribution --distribution-config file://cloudfront-config.json --query 'Distribution.Id' --output text)
    rm cloudfront-config.json
    
    echo -e "${GREEN}✅ CloudFront distribution created: ${DISTRIBUTION_ID}${NC}"
    echo -e "${YELLOW}⏳ Wait for CloudFront distribution to be deployed${NC}"
}

# Function to create App Runner service
create_app_runner_service() {
    echo -e "${BLUE}🚀 Creating App Runner service: ${APP_RUNNER_SERVICE}${NC}"
    
    # Wait for RDS to be available
    echo -e "${YELLOW}⏳ Waiting for RDS instance to be available...${NC}"
    aws rds wait db-instance-available --db-instance-identifier ${DB_INSTANCE_ID}
    
    # Get RDS endpoint
    RDS_ENDPOINT=$(aws rds describe-db-instances --db-instance-identifier ${DB_INSTANCE_ID} --query 'DBInstances[0].Endpoint.Address' --output text)
    
    cat > apprunner-config.yaml << EOF
version: 1.0
runtime: python3
build:
  commands:
    build:
      - echo "Building Neo Networker Backend"
run:
  runtime-version: 3.10.0
  command: python main.py
  network:
    port: 5002
    env: PORT
  env:
    - name: DATABASE_URL
      value: postgresql://postgres:TestPassword123!@${RDS_ENDPOINT}:5432/postgres
    - name: FLASK_ENV
      value: ${ENVIRONMENT}
    - name: JWT_SECRET_KEY
      value: test-jwt-secret-key-${ENVIRONMENT}
    - name: OPENAI_API_KEY
      value: ${OPENAI_API_KEY}
    - name: TELEGRAM_BOT_TOKEN
      value: ${TELEGRAM_BOT_TOKEN}
    - name: GOOGLE_CLIENT_ID
      value: ${GOOGLE_CLIENT_ID}
    - name: GOOGLE_CLIENT_SECRET
      value: ${GOOGLE_CLIENT_SECRET}
    - name: GOOGLE_REDIRECT_URI
      value: https://${APP_RUNNER_SERVICE}.us-east-1.awsapprunner.com/api/auth/google/callback
EOF
    
    aws apprunner create-service \
        --service-name ${APP_RUNNER_SERVICE} \
        --source-configuration '{
            "ImageRepository": {
                "ImageIdentifier": "587842257084.dkr.ecr.us-east-1.amazonaws.com/repo:latest",
                "ImageConfiguration": {
                    "Port": "5002",
                    "RuntimeEnvironmentVariables": {
                        "DATABASE_URL": "postgresql://postgres:TestPassword123!@'${RDS_ENDPOINT}':5432/postgres",
                        "FLASK_ENV": "'${ENVIRONMENT}'",
                        "JWT_SECRET_KEY": "test-jwt-secret-key-'${ENVIRONMENT}'"
                    }
                },
                "ImageRepositoryType": "ECR"
            }
        }' \
        --instance-configuration '{
            "Cpu": "0.25 vCPU",
            "Memory": "0.5 GB"
        }' \
        --region ${REGION}
    
    rm apprunner-config.yaml
    
    echo -e "${GREEN}✅ App Runner service creation initiated${NC}"
}

# Main execution
if [ "$ENVIRONMENT" = "test" ]; then
    echo -e "${BLUE}🔧 Creating test environment infrastructure...${NC}"
    
    # Check if resources already exist
    if aws rds describe-db-instances --db-instance-identifier ${DB_INSTANCE_ID} >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  RDS instance ${DB_INSTANCE_ID} already exists${NC}"
    else
        create_rds_instance
    fi
    
    if aws s3api head-bucket --bucket ${S3_BUCKET} >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  S3 bucket ${S3_BUCKET} already exists${NC}"
    else
        create_s3_bucket
    fi
    
    create_cloudfront_distribution
    create_app_runner_service
    
    echo -e "${GREEN}🎉 Test environment setup complete!${NC}"
    echo -e "${BLUE}📋 Next steps:${NC}"
    echo "  1. Wait for all services to be ready"
    echo "  2. Run database migrations"
    echo "  3. Deploy frontend to test S3 bucket"
    echo "  4. Deploy backend to test App Runner"
    
elif [ "$ENVIRONMENT" = "prod" ]; then
    echo -e "${YELLOW}ℹ️  Production environment already exists${NC}"
    echo -e "${BLUE}📋 Current production resources:${NC}"
    echo "  Database: ${DB_INSTANCE_ID}"
    echo "  App Runner: ${APP_RUNNER_SERVICE}"
    echo "  S3 Bucket: ${S3_BUCKET}"
    echo "  CloudFront: ${CLOUDFRONT_DISTRIBUTION}"
fi
