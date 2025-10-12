# Complete CI/CD Setup Guide

## 🚀 **Multi-Environment CI/CD Pipeline**

### **📋 Architecture Overview**

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   DEV       │    │   TEST      │    │   PROD      │
│ (Local)     │───▶│ (AWS Test)  │───▶│ (AWS Prod)  │
│ Docker      │    │ Separate    │    │ Current     │
│             │    │ Services    │    │ Services    │
└─────────────┘    └─────────────┘    └─────────────┘
      │                    │                    │
      │                    │                    │
   Manual Push         Auto Deploy         Manual Promote
   to dev branch      (GitHub Actions)     (GitHub Actions)
```

### **🔄 CI/CD Pipeline Flow**

1. **Development** → Push to `dev` branch → Auto deploy to Test Environment
2. **Testing** → Test everything in AWS Test Environment
3. **Production** → Manual promotion → Deploy to Production Environment

## 🛠️ **Setup Instructions**

### **Step 1: Create Git Branches**

```bash
# Create and push branches
git checkout -b dev
git push origin dev

git checkout -b test  
git push origin test

# Switch back to main
git checkout main
```

### **Step 2: Set Up GitHub Secrets**

```bash
# Make script executable
chmod +x setup-github-secrets.sh

# Run the setup script
./setup-github-secrets.sh
```

**Required GitHub Secrets:**
- `AWS_ACCESS_KEY_ID` - Your AWS access key
- `AWS_SECRET_ACCESS_KEY` - Your AWS secret key
- `TEST_DB_PASSWORD` - Test database password
- `PROD_DB_PASSWORD` - Production database password
- `TELEGRAM_BOT_TOKEN` - Your Telegram bot token
- `WHATSAPP_ACCESS_TOKEN` - WhatsApp API token
- `OPENAI_API_KEY` - OpenAI API key
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key

### **Step 3: Create Test Environment Infrastructure**

```bash
# Create AWS test environment
./setup-environment.sh test

# Wait for AWS resources to be ready (5-10 minutes)
# Check status:
aws rds describe-db-instances --db-instance-identifier neo-networker-db-test
aws apprunner list-services --query "ServiceSummaryList[?ServiceName=='neo-networker-backend-test']"
```

### **Step 4: Update GitHub Secrets**

After creating the test environment, update the CloudFront distribution ID:

```bash
# Get the CloudFront distribution ID
aws cloudfront list-distributions --query "DistributionList.Items[?Comment=='Neo Networker test Frontend'].Id" --output text

# Set it as a GitHub secret
gh secret set TEST_CLOUDFRONT_DISTRIBUTION_ID --repo roeeshuffle/neo-networker --body "DISTRIBUTION_ID_HERE"
```

### **Step 5: Test the Pipeline**

```bash
# Make changes and push to dev branch
git checkout dev
# Make some changes
git add .
git commit -m "test: test CI/CD pipeline"
git push origin dev

# This will trigger automatic deployment to test environment
```

## 🔄 **CI/CD Workflows**

### **1. Deploy to Test Environment**
- **Trigger**: Push to `dev` branch
- **Actions**:
  - Build backend Docker image
  - Build frontend with test API URL
  - Deploy to test AWS services
  - Run database migrations
  - Run tests

### **2. Promote Test to Production**
- **Trigger**: Manual workflow dispatch
- **Actions**:
  - Run tests (optional)
  - Merge `test` branch to `main`
  - Create release tag
  - Trigger production deployment

### **3. Deploy to Production**
- **Trigger**: Push to `main` branch
- **Actions**:
  - Build backend Docker image
  - Build frontend with production API URL
  - Deploy to production AWS services
  - Manual database migration reminder

## 🌐 **Environment URLs**

| Environment | Frontend | Backend | Database |
|-------------|----------|---------|----------|
| **Dev** | http://localhost:3000 | http://localhost:5002 | Local PostgreSQL |
| **Test** | https://test-cdn.cloudfront.net | https://test-backend.awsapprunner.com | neo-networker-db-test |
| **Prod** | https://d2fq8k5py78ii.cloudfront.net | https://dkdrn34xpx.us-east-1.awsapprunner.com | neo-networker-db-v2 |

## 📊 **AWS Resources**

### **Test Environment (New)**
- **RDS**: `neo-networker-db-test` (PostgreSQL 17.4, t3.micro)
- **App Runner**: `neo-networker-backend-test`
- **S3**: `neo-networker-frontend-test`
- **CloudFront**: `neo-networker-frontend-test-cdn`

### **Production Environment (Existing)**
- **RDS**: `neo-networker-db-v2` (PostgreSQL 17.4, t3.micro)
- **App Runner**: `neo-networker-backend-final`
- **S3**: `neo-networker-frontend-1758372954`
- **CloudFront**: `E2EFFEJ56BYWCG`

## 🚀 **Deployment Process**

### **Development Workflow**
```bash
# 1. Make changes locally
git checkout dev
# Make changes
git add .
git commit -m "feat: new feature"
git push origin dev

# 2. Automatic deployment to test environment
# 3. Test everything in test environment
# 4. If everything works, promote to production
```

### **Production Deployment**
```bash
# Option 1: Use GitHub Actions (Recommended)
# Go to GitHub → Actions → "Promote Test to Production"
# Type "PROMOTE" to confirm

# Option 2: Manual merge
git checkout main
git merge test
git push origin main
```

## 🛡️ **Safety Features**

- ✅ **Automatic testing** before production deployment
- ✅ **Manual approval** required for production
- ✅ **Database migration safety** (manual for production)
- ✅ **Rollback capability** via Git
- ✅ **Environment isolation** (separate AWS resources)
- ✅ **Secret management** via GitHub Secrets

## 💰 **Cost Estimate**

- **Test Environment**: ~$15-25/month
- **Production**: Your current costs (unchanged)
- **Total Additional Cost**: ~$15-25/month

## 🔧 **Troubleshooting**

### **Test Environment Issues**
```bash
# Check App Runner status
aws apprunner describe-service --service-arn arn:aws:apprunner:us-east-1:587842257084:service/neo-networker-backend-test/...

# Check RDS status
aws rds describe-db-instances --db-instance-identifier neo-networker-db-test

# Check CloudFront status
aws cloudfront get-distribution --id YOUR_TEST_DISTRIBUTION_ID
```

### **CI/CD Pipeline Issues**
- Check GitHub Actions logs
- Verify all secrets are set correctly
- Ensure AWS permissions are correct
- Check if AWS resources are ready

## 📈 **Benefits**

- ✅ **Zero-downtime deployments**
- ✅ **Automated testing**
- ✅ **Safe production deployments**
- ✅ **Easy rollbacks**
- ✅ **Environment consistency**
- ✅ **Automated database migrations**
- ✅ **Secret management**
- ✅ **Release tagging**

## 🎯 **Next Steps**

1. **Set up GitHub Secrets** using the provided script
2. **Create test environment** infrastructure
3. **Test the pipeline** with a small change
4. **Verify everything works** in test environment
5. **Promote to production** when ready

This setup gives you a professional, production-ready CI/CD pipeline that ensures safe deployments and easy testing! 🚀
