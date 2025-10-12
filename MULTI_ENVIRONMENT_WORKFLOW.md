# Multi-Environment Git Workflow

## 🌿 Branch Strategy

```
main (production)
├── test (staging/testing)
├── dev (development)
└── feature/* (feature branches)
```

## 📋 Workflow Process

### 1. **Development Phase** (Local)
```bash
# Start local development
git checkout dev
git pull origin dev

# Make changes
git add .
git commit -m "feat: add new feature"
git push origin dev

# Test locally
./deploy.sh dev
```

### 2. **Testing Phase** (AWS Test Environment)
```bash
# Merge dev to test
git checkout test
git merge dev
git push origin test

# Deploy to test environment
./deploy.sh test all

# Test on AWS test environment
# - Test all features
# - Verify database migrations
# - Check integrations (Google, Telegram, WhatsApp)
# - Test performance
```

### 3. **Production Phase** (AWS Production)
```bash
# Only after thorough testing in test environment
git checkout main
git merge test
git push origin main

# Deploy to production
./deploy.sh prod all
```

## 🚀 Deployment Commands

### Local Development
```bash
./deploy.sh dev
# Starts local Docker environment
```

### Test Environment
```bash
# Deploy everything
./deploy.sh test all

# Deploy specific components
./deploy.sh test backend
./deploy.sh test frontend
./deploy.sh test migrations
```

### Production Environment
```bash
# Deploy everything (after testing)
./deploy.sh prod all

# Deploy specific components
./deploy.sh prod backend
./deploy.sh prod frontend
```

## 🔧 Environment Setup

### Initial Setup
```bash
# Create test environment infrastructure
./setup-environment.sh test

# Wait for AWS resources to be ready
# Then deploy to test
./deploy.sh test all
```

## 📊 Environment URLs

| Environment | Frontend | Backend | Database |
|-------------|----------|---------|----------|
| **Dev** | http://localhost:3000 | http://localhost:5002 | Local PostgreSQL |
| **Test** | https://test-cdn.cloudfront.net | https://test-backend.awsapprunner.com | neo-networker-db-test |
| **Prod** | https://d2fq8k5py78ii.cloudfront.net | https://dkdrn34xpx.us-east-1.awsapprunner.com | neo-networker-db-v2 |

## ⚠️ Important Rules

1. **Never deploy directly to production** without testing in test environment first
2. **Always test database migrations** in test environment before production
3. **Use feature branches** for major changes
4. **Test all integrations** (Google, Telegram, WhatsApp) in test environment
5. **Monitor test environment** before promoting to production

## 🐛 Troubleshooting

### Test Environment Issues
```bash
# Check App Runner status
aws apprunner describe-service --service-arn arn:aws:apprunner:us-east-1:587842257084:service/neo-networker-backend-test/...

# Check RDS status
aws rds describe-db-instances --db-instance-identifier neo-networker-db-test

# Check CloudFront status
aws cloudfront get-distribution --id neo-networker-frontend-test-cdn
```

### Production Issues
```bash
# Check production services
aws apprunner describe-service --service-arn arn:aws:apprunner:us-east-1:587842257084:service/neo-networker-backend-final/...

# Rollback if needed
git checkout main
git reset --hard HEAD~1
git push origin main --force
./deploy.sh prod all
```

## 📈 Benefits

- ✅ **Safe deployments** - Test everything before production
- ✅ **Rollback capability** - Easy to revert if issues occur
- ✅ **Environment parity** - Same setup across dev/test/prod
- ✅ **Automated deployments** - Consistent deployment process
- ✅ **Database safety** - Test migrations before production
- ✅ **Integration testing** - Test all external services in test environment
