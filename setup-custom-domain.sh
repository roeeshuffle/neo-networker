#!/bin/bash

# Custom Domain Setup Script for leeeed.com
# This script configures CloudFront and App Runner for custom domains

set -e

echo "🌐 Setting up custom domains for leeeed.com..."

# Variables
CERTIFICATE_ARN="arn:aws:acm:us-east-1:587842257084:certificate/aeccf990-43c3-4a9a-9034-756054ba33ba"
FRONTEND_DOMAIN="leeeed.com"
API_DOMAIN="api.leeeed.com"
CLOUDFRONT_DISTRIBUTION_ID="E2DAWUD5NLUY6G"  # Production CloudFront
APP_RUNNER_SERVICE_ARN="arn:aws:apprunner:us-east-1:587842257084:service/neo-networker-backend-final/3f3d591c486b4865b677fe0a518ac976"

echo "📋 Configuration:"
echo "  Frontend Domain: $FRONTEND_DOMAIN"
echo "  API Domain: $API_DOMAIN"
echo "  Certificate ARN: $CERTIFICATE_ARN"
echo "  CloudFront Distribution: $CLOUDFRONT_DISTRIBUTION_ID"
echo ""

# Step 1: Check certificate status
echo "🔐 Checking certificate validation status..."
CERT_STATUS=$(aws acm describe-certificate --certificate-arn "$CERTIFICATE_ARN" --query "Certificate.Status" --output text)

if [ "$CERT_STATUS" != "ISSUED" ]; then
    echo "❌ Certificate is not yet validated. Status: $CERT_STATUS"
    echo "⏳ Please wait for DNS propagation and certificate validation to complete."
    echo "   You can check status with:"
    echo "   aws acm describe-certificate --certificate-arn \"$CERTIFICATE_ARN\" --query \"Certificate.Status\" --output text"
    exit 1
fi

echo "✅ Certificate is validated and ready!"

# Step 2: Update CloudFront distribution for frontend domain
echo "🌐 Updating CloudFront distribution for $FRONTEND_DOMAIN..."

# Get current CloudFront config
aws cloudfront get-distribution-config --id "$CLOUDFRONT_DISTRIBUTION_ID" > cloudfront-config.json

# Update the config to add custom domain
python3 -c "
import json

# Read current config
with open('cloudfront-config.json', 'r') as f:
    data = json.load(f)

config = data['DistributionConfig']

# Add custom domain
config['Aliases'] = {
    'Quantity': 1,
    'Items': ['$FRONTEND_DOMAIN']
}

# Update viewer certificate
config['ViewerCertificate'] = {
    'ACMCertificateArn': '$CERTIFICATE_ARN',
    'SSLSupportMethod': 'sni-only',
    'MinimumProtocolVersion': 'TLSv1.2_2021',
    'CertificateSource': 'acm'
}

# Write updated config
with open('cloudfront-updated.json', 'w') as f:
    json.dump(config, f, indent=2)

print('✅ CloudFront configuration updated')
"

# Apply CloudFront changes
aws cloudfront update-distribution \
    --id "$CLOUDFRONT_DISTRIBUTION_ID" \
    --distribution-config file://cloudfront-updated.json \
    --if-match "$(jq -r '.ETag' cloudfront-config.json)"

echo "✅ CloudFront distribution updated with custom domain!"

# Step 3: Update App Runner for API domain
echo "🔧 Updating App Runner service for $API_DOMAIN..."

# Create custom domain for App Runner
aws apprunner create-custom-domain \
    --service-arn "$APP_RUNNER_SERVICE_ARN" \
    --domain-name "$API_DOMAIN" \
    --certificate-arn "$CERTIFICATE_ARN"

echo "✅ App Runner custom domain created!"

# Step 4: Update DNS records
echo "📝 DNS Records to add in GoDaddy:"
echo ""
echo "For Frontend (leeeed.com):"
echo "Type: CNAME"
echo "Name: @"
echo "Value: d2fq8k5py78ii.cloudfront.net"
echo "TTL: 300"
echo ""
echo "For API (api.leeeed.com):"
echo "Type: CNAME" 
echo "Name: api"
echo "Value: [App Runner domain - will be provided after custom domain creation]"
echo "TTL: 300"
echo ""

# Step 5: Update environment variables
echo "🔧 Environment variables to update:"
echo ""
echo "Production Frontend URL: https://$FRONTEND_DOMAIN"
echo "Production API URL: https://$API_DOMAIN"
echo ""

# Cleanup
rm -f cloudfront-config.json cloudfront-updated.json

echo "🎉 Custom domain setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Add the DNS CNAME records in GoDaddy as shown above"
echo "2. Wait for DNS propagation (5-30 minutes)"
echo "3. Update production environment variables with new URLs"
echo "4. Test the custom domains"
echo ""
echo "🔗 Your new URLs will be:"
echo "  Frontend: https://$FRONTEND_DOMAIN"
echo "  API: https://$API_DOMAIN"
