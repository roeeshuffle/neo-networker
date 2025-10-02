# 🚀 DEPLOYMENT CHECKLIST

## ✅ **ALWAYS DEPLOY FRONTEND AFTER CHANGES**

### **Frontend Deployment Process:**
```bash
cd frontend
npm run build
aws s3 sync dist/ s3://neo-networker-frontend-1758372954 --delete
aws cloudfront create-invalidation --distribution-id E2EFFEJ56BYWCG --paths "/*"
```

### **Backend Deployment Process:**
```bash
git add .
git commit -m "Version X.X: Description"
git push origin main
# App Runner auto-deploys backend
```

## 📋 **COMPLETE DEPLOYMENT WORKFLOW**

### **When Making ANY Changes:**

1. **✅ Make Code Changes**
2. **✅ Update Version Numbers** (backend + frontend)
3. **✅ Commit & Push Backend** (auto-deploys)
4. **✅ MANUALLY DEPLOY FRONTEND** (always required!)
5. **✅ Verify Changes Live**

### **Frontend Deployment Commands:**
```bash
# Build frontend
cd frontend && npm run build

# Deploy to S3
aws s3 sync dist/ s3://neo-networker-frontend-1758372954 --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id E2EFFEJ56BYWCG --paths "/*"
```

### **Backend Deployment Commands:**
```bash
# Commit changes
git add .
git commit -m "Version X.X: Description"
git push origin main

# Manual deployment (if needed)
aws apprunner start-deployment --service-arn arn:aws:apprunner:us-east-1:587842257084:service/neo-networker-backend-final/3f3d591c486b4865b677fe0a518ac976
```

## ⚠️ **CRITICAL REMINDERS**

- **Frontend changes NEVER auto-deploy**
- **Always run frontend deployment after frontend changes**
- **Backend auto-deploys with git push**
- **Check both frontend and backend are updated**

## 🔍 **Verification Steps**

1. **Backend**: Check App Runner logs for version number
2. **Frontend**: Check browser console for version number
3. **Cache**: Wait 2-5 minutes for CloudFront invalidation
4. **Test**: Verify changes work as expected

## 📝 **Current Versions**

- **Backend**: Version 8.0 - Backend Status Filter Fix
- **Frontend**: Version 7.0 - Button Fixes & Task Filter Debug
- **S3 Bucket**: neo-networker-frontend-1758372954
- **CloudFront**: E2EFFEJ56BYWCG
- **App Runner**: neo-networker-backend-final
