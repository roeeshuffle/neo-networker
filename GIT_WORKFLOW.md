# 🔄 Git Workflow - Test vs Production

## 📋 Branch Structure

- **`test`** - Development and testing branch
- **`main`** - Production branch (stable releases only)

## 🚀 Development Workflow

### 1. Working on Features (Test Branch)
```bash
# Always work on test branch
git checkout test

# Make your changes
# Test locally at http://localhost:8081

# Commit changes
git add .
git commit -m "Feature: Description of changes"

# Push to test branch
git push origin test
```

### 2. Deploying to Production
```bash
# Only when explicitly requested by user
# Switch to main branch
git checkout main

# Merge test branch
git merge test

# Push to production
git push origin main

# This triggers production deployment
```

## 🔧 Environment Configuration

### Test Environment
- **Frontend**: http://localhost:8081
- **Backend**: http://localhost:5002
- **Database**: Local PostgreSQL
- **Config**: `.env.local` or `env.test.example`

### Production Environment
- **Frontend**: https://d2fq8k5py78ii.cloudfront.net/
- **Backend**: AWS App Runner
- **Database**: AWS RDS
- **Config**: Production environment variables

## ⚠️ Important Rules

1. **NEVER deploy to production without explicit user request**
2. **Always test changes in local environment first**
3. **Use test branch for all development work**
4. **Only merge test → main when ready for production**

## 🛠️ Commands Reference

```bash
# Switch to test branch (for development)
git checkout test

# Switch to main branch (for production)
git checkout main

# Create new feature branch from test
git checkout test
git checkout -b feature/new-feature

# Merge test into main (production deployment)
git checkout main
git merge test
git push origin main
```

## 📝 Deployment Checklist

### Before Production Deployment:
- [ ] All changes tested in local environment
- [ ] User explicitly requested production deployment
- [ ] Test branch is stable and ready
- [ ] Environment variables configured for production
- [ ] Database migrations applied (if needed)

### After Production Deployment:
- [ ] Verify production deployment is working
- [ ] Check logs for any errors
- [ ] Confirm all features are working as expected
