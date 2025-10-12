# Environment Variables Management
# This file contains all environment variables for different environments

# =============================================================================
# DEVELOPMENT ENVIRONMENT (Local Docker)
# =============================================================================
DEV_DATABASE_URL=postgresql://postgres:localpassword@postgres:5432/neo_networker_local
DEV_JWT_SECRET_KEY=local-development-jwt-secret-key
DEV_FLASK_ENV=development
DEV_DEBUG=true
DEV_VITE_API_URL=http://localhost:5002/api
DEV_GOOGLE_REDIRECT_URI=http://localhost:5002/api/auth/google/callback

# =============================================================================
# TEST ENVIRONMENT (AWS Test Services)
# =============================================================================
TEST_DATABASE_URL=postgresql://postgres:TestPassword123!@neo-networker-db-test.c0d2k4qwgenr.us-east-1.rds.amazonaws.com:5432/postgres
TEST_JWT_SECRET_KEY=test-jwt-secret-key-for-testing-environment
TEST_FLASK_ENV=test
TEST_DEBUG=true
TEST_VITE_API_URL=https://neo-networker-backend-test.us-east-1.awsapprunner.com/api
TEST_GOOGLE_REDIRECT_URI=https://neo-networker-backend-test.us-east-1.awsapprunner.com/api/auth/google/callback

# Test Environment AWS Resources
TEST_RDS_INSTANCE_ID=neo-networker-db-test
TEST_APP_RUNNER_SERVICE=neo-networker-backend-test
TEST_S3_BUCKET=neo-networker-frontend-test
TEST_CLOUDFRONT_DISTRIBUTION=neo-networker-frontend-test-cdn

# =============================================================================
# PRODUCTION ENVIRONMENT (AWS Production Services)
# =============================================================================
PROD_DATABASE_URL=postgresql://postgres:PROD_PASSWORD@neo-networker-db-v2.c0d2k4qwgenr.us-east-1.rds.amazonaws.com:5432/postgres
PROD_JWT_SECRET_KEY=production-jwt-secret-key-CHANGE-THIS
PROD_FLASK_ENV=production
PROD_DEBUG=false
PROD_VITE_API_URL=https://api.leeeed.com/api
PROD_GOOGLE_REDIRECT_URI=https://api.leeeed.com/api/auth/google/callback

# Production Environment AWS Resources
PROD_RDS_INSTANCE_ID=neo-networker-db-v2
PROD_APP_RUNNER_SERVICE=neo-networker-backend-final
PROD_S3_BUCKET=neo-networker-frontend-1758372954
PROD_CLOUDFRONT_DISTRIBUTION=E2EFFEJ56BYWCG

# =============================================================================
# SHARED SECRETS (Same across all environments)
# =============================================================================
# These should be set as GitHub Secrets
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_ASSISTANT_ID=asst_ywyYJshVjop8vd5hvXv1Nn1r
TELEGRAM_BOT_TOKEN=your-telegram-bot-token-here
WHATSAPP_ACCESS_TOKEN=your-whatsapp-access-token-here
WHATSAPP_PHONE_NUMBER_ID=your-whatsapp-phone-number-id-here
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your-webhook-verify-token-here
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
STRIPE_SECRET_KEY=your-stripe-secret-key-here
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key-here

# AWS Credentials (for CI/CD)
AWS_ACCESS_KEY_ID=your-aws-access-key-id-here
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key-here

# Database Passwords (for CI/CD)
TEST_DB_PASSWORD=TestPassword123!
PROD_DB_PASSWORD=your-production-db-password-here
