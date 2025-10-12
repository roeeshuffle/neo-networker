#!/bin/bash
# GitHub Secrets Setup Script
# This script helps you set up all the required GitHub Secrets for CI/CD

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

REPO_NAME="roeeshuffle/neo-networker"

echo -e "${BLUE}🔐 GitHub Secrets Setup for CI/CD${NC}"
echo -e "${YELLOW}Repository: ${REPO_NAME}${NC}"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) is not installed${NC}"
    echo -e "${YELLOW}Please install it first: https://cli.github.com/${NC}"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ Not authenticated with GitHub CLI${NC}"
    echo -e "${YELLOW}Please run: gh auth login${NC}"
    exit 1
fi

echo -e "${GREEN}✅ GitHub CLI is installed and authenticated${NC}"
echo ""

# Function to set secret
set_secret() {
    local secret_name=$1
    local secret_description=$2
    local secret_value=""
    
    echo -e "${BLUE}Setting secret: ${secret_name}${NC}"
    echo -e "${YELLOW}Description: ${secret_description}${NC}"
    
    # Read secret value
    read -s -p "Enter value for ${secret_name}: " secret_value
    echo ""
    
    if [ -z "$secret_value" ]; then
        echo -e "${YELLOW}⚠️  Skipping ${secret_name} (empty value)${NC}"
        return
    fi
    
    # Set the secret
    echo "$secret_value" | gh secret set "$secret_name" --repo "$REPO_NAME"
    echo -e "${GREEN}✅ Set ${secret_name}${NC}"
    echo ""
}

echo -e "${BLUE}🔧 Setting up AWS Credentials${NC}"
set_secret "AWS_ACCESS_KEY_ID" "AWS Access Key ID for CI/CD deployments"
set_secret "AWS_SECRET_ACCESS_KEY" "AWS Secret Access Key for CI/CD deployments"

echo -e "${BLUE}🗄️  Setting up Database Passwords${NC}"
set_secret "TEST_DB_PASSWORD" "Test database password (TestPassword123!)"
set_secret "PROD_DB_PASSWORD" "Production database password"

echo -e "${BLUE}🤖 Setting up Bot Tokens${NC}"
set_secret "TELEGRAM_BOT_TOKEN" "Telegram Bot Token"
set_secret "WHATSAPP_ACCESS_TOKEN" "WhatsApp Business API Access Token"
set_secret "WHATSAPP_PHONE_NUMBER_ID" "WhatsApp Phone Number ID"
set_secret "WHATSAPP_WEBHOOK_VERIFY_TOKEN" "WhatsApp Webhook Verify Token"

echo -e "${BLUE}🔍 Setting up OpenAI${NC}"
set_secret "OPENAI_API_KEY" "OpenAI API Key"
set_secret "OPENAI_ASSISTANT_ID" "OpenAI Assistant ID (asst_ywyYJshVjop8vd5hvXv1Nn1r)"

echo -e "${BLUE}🔐 Setting up Google OAuth${NC}"
set_secret "GOOGLE_CLIENT_ID" "Google OAuth Client ID"
set_secret "GOOGLE_CLIENT_SECRET" "Google OAuth Client Secret"

echo -e "${BLUE}💳 Setting up Stripe${NC}"
set_secret "STRIPE_SECRET_KEY" "Stripe Secret Key"
set_secret "STRIPE_PUBLISHABLE_KEY" "Stripe Publishable Key"

echo -e "${BLUE}☁️  Setting up AWS Resource IDs${NC}"
set_secret "TEST_CLOUDFRONT_DISTRIBUTION_ID" "Test CloudFront Distribution ID (will be created by setup script)"

echo ""
echo -e "${GREEN}🎉 GitHub Secrets setup complete!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo "1. Create test environment: ./setup-environment.sh test"
echo "2. Update TEST_CLOUDFRONT_DISTRIBUTION_ID secret with the created distribution ID"
echo "3. Push to dev branch to trigger test deployment"
echo "4. Test everything in test environment"
echo "5. Use 'Promote Test to Production' workflow to deploy to production"
echo ""
echo -e "${YELLOW}⚠️  Remember to keep these secrets secure and never commit them to code!${NC}"
