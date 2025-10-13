# Complete CI/CD Deployment Workflow

## 🚀 Development to Test (Automatic)

```bash
# 1. Switch to dev branch
git checkout dev

# 2. Make your changes
# Edit files, add features, fix bugs...

# 3. Commit and push
git add .
git commit -m "feat: add new feature"
git push origin dev

# 4. Watch GitHub Actions deploy automatically!
# Go to: https://github.com/roeeshuffle/neo-networker/actions
# You'll see "Deploy to Test Environment" workflow running
```

## 🧪 Testing in Test Environment

```bash
# Test your changes at:
# Frontend: https://E2DAWUD5NLUY6G.cloudfront.net
# Backend: https://neo-networker-backend-test.us-east-1.awsapprunner.com

# Test everything:
# - Login/logout
# - All features
# - Google OAuth
# - Telegram bot
# - WhatsApp bot
# - Database operations
```

## 🚀 Test to Production (Manual)

### Option A: GitHub Actions (Recommended)

1. Go to: https://github.com/roeeshuffle/neo-networker/actions
2. Find "Promote Test to Production" workflow
3. Click "Run workflow"
4. Type "PROMOTE" to confirm
5. Click "Run workflow"

### Option B: Manual Git Commands

```bash
# 1. Switch to main branch
git checkout main

# 2. Merge test branch
git merge test

# 3. Push to main (triggers production deployment)
git push origin main

# 4. Watch GitHub Actions deploy to production!
```

## 📊 Environment URLs

| Environment | Frontend | Backend | Database |
|-------------|----------|---------|----------|
| **Dev** | http://localhost:3000 | http://localhost:5002 | Local PostgreSQL |
| **Test** | https://E2DAWUD5NLUY6G.cloudfront.net | https://neo-networker-backend-test.us-east-1.awsapprunner.com | neo-networker-db-test |
| **Prod** | https://d2fq8k5py78ii.cloudfront.net | https://dkdrn34xpx.us-east-1.awsapprunner.com | neo-networker-db-v2 |

## 🛡️ Safety Features

- ✅ **Automatic testing** before production
- ✅ **Manual approval** required for production
- ✅ **Environment isolation** (test can't affect production)
- ✅ **Easy rollbacks** via Git
- ✅ **Database migration safety**

## 🔧 Quick Commands

```bash
# Check workflow status
gh run list --limit 5

# View current workflow
gh run view

# Check workflow logs
gh run view --log

# Check GitHub secrets
gh secret list
```

## 🚨 Important Notes

1. **Always test in test environment first**
2. **Never push directly to main** without testing
3. **Use the "Promote Test to Production" workflow** for safety
4. **Run database migrations manually** in production
5. **Monitor deployments** in GitHub Actions
