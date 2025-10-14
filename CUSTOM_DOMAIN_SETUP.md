# Custom Domain Setup Guide for leeeed.com

## 🎯 Overview
This guide will help you set up custom domains for your production environment:
- **Frontend**: `leeeed.com` → CloudFront distribution
- **API**: `api.leeeed.com` → App Runner service

## 📋 Prerequisites
- ✅ SSL Certificate: `arn:aws:acm:us-east-1:587842257084:certificate/aeccf990-43c3-4a9a-9034-756054ba33ba`
- ✅ DNS Validation Records: Added to GoDaddy
- ⏳ Certificate Status: PENDING_VALIDATION (waiting for DNS propagation)

## 🔐 Step 1: Wait for Certificate Validation

Check certificate status:
```bash
aws acm describe-certificate --certificate-arn "arn:aws:acm:us-east-1:587842257084:certificate/aeccf990-43c3-4a9a-9034-756054ba33ba" --query "Certificate.Status" --output text
```

Wait until status shows `ISSUED` before proceeding.

## 🌐 Step 2: Configure CloudFront for Frontend Domain

### 2.1 Get Current CloudFront Configuration
```bash
aws cloudfront get-distribution-config --id "E2DAWUD5NLUY6G" > cloudfront-config.json
```

### 2.2 Update Configuration
The configuration needs these changes:
- Add `leeeed.com` to Aliases
- Update ViewerCertificate to use ACM certificate

### 2.3 Apply Changes
```bash
aws cloudfront update-distribution \
    --id "E2DAWUD5NLUY6G" \
    --distribution-config file://cloudfront-updated.json \
    --if-match "$(jq -r '.ETag' cloudfront-config.json)"
```

## 🔧 Step 3: Configure App Runner for API Domain

### 3.1 Create Custom Domain
```bash
aws apprunner create-custom-domain \
    --service-arn "arn:aws:apprunner:us-east-1:587842257084:service/neo-networker-backend-final/3f3d591c486b4865b677fe0a518ac976" \
    --domain-name "api.leeeed.com" \
    --certificate-arn "arn:aws:acm:us-east-1:587842257084:certificate/aeccf990-43c3-4a9a-9034-756054ba33ba"
```

### 3.2 Get App Runner Domain
```bash
aws apprunner describe-custom-domains \
    --service-arn "arn:aws:apprunner:us-east-1:587842257084:service/neo-networker-backend-final/3f3d591c486b4865b677fe0a518ac976"
```

## 📝 Step 4: Update DNS Records in GoDaddy

### 4.1 Frontend Domain (leeeed.com)
```
Type: CNAME
Name: @
Value: d2fq8k5py78ii.cloudfront.net
TTL: 300
```

### 4.2 API Domain (api.leeeed.com)
```
Type: CNAME
Name: api
Value: [App Runner domain from Step 3.2]
TTL: 300
```

## 🔧 Step 5: Update Environment Variables

### 5.1 Update Production Workflow
Update `.github/workflows/deploy-production.yml`:
```yaml
VITE_API_URL: https://api.leeeed.com/api
```

### 5.2 Update App Runner Environment Variables
Update these variables in the App Runner service:
```
FRONTEND_URL: https://leeeed.com
GOOGLE_REDIRECT_URI: https://leeeed.com/auth/google/callback
```

## 🧪 Step 6: Test Custom Domains

### 6.1 Test Frontend
- Visit: https://leeeed.com
- Should load your React application

### 6.2 Test API
- Visit: https://api.leeeed.com/api/health
- Should return: `{"status": "healthy"}`

### 6.3 Test Login Flow
- Try logging in at https://leeeed.com
- Should connect to https://api.leeeed.com/api/auth/login

## 🚨 Troubleshooting

### Certificate Still Pending
- Check DNS propagation: `nslookup _07fed626ad472a17b96098e4fc339073.leeeed.com`
- Wait 5-30 minutes for DNS propagation
- Verify CNAME records in GoDaddy are correct

### CloudFront Issues
- Check distribution status: `aws cloudfront get-distribution --id "E2DAWUD5NLUY6G"`
- Wait for deployment to complete (can take 15-20 minutes)

### App Runner Issues
- Check service status: `aws apprunner describe-service --service-arn "arn:aws:apprunner:us-east-1:587842257084:service/neo-networker-backend-final/3f3d591c486b4865b677fe0a518ac976"`
- Check custom domain status: `aws apprunner describe-custom-domains --service-arn "..."`

## 📊 Expected Timeline
- **Certificate Validation**: 5-30 minutes (after DNS propagation)
- **CloudFront Update**: 15-20 minutes
- **App Runner Custom Domain**: 5-10 minutes
- **DNS Propagation**: 5-30 minutes
- **Total**: 30-90 minutes

## 🎉 Final Result
After completion, your application will be accessible at:
- **Frontend**: https://leeeed.com
- **API**: https://api.leeeed.com
- **Health Check**: https://api.leeeed.com/api/health
