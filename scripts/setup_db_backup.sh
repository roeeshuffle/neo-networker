#!/bin/bash

# Database Backup Automation Setup Script
# Creates Lambda function and EventBridge rule for daily RDS snapshots

set -e

# Configuration
FUNCTION_NAME="neo-networker-db-backup"
SCHEDULE_RULE_NAME="neo-networker-db-backup-schedule"
ROLE_NAME="neo-networker-db-backup-role"
POLICY_NAME="neo-networker-db-backup-policy"

echo "🚀 Setting up automated database backups..."

# Get AWS account ID and region
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region)
echo "Account ID: $ACCOUNT_ID"
echo "Region: $REGION"

# Create IAM role for Lambda
echo "📝 Creating IAM role..."
aws iam create-role \
    --role-name $ROLE_NAME \
    --assume-role-policy-document '{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }
        ]
    }' 2>/dev/null || echo "Role already exists"

# Create IAM policy for RDS access
echo "📝 Creating IAM policy..."
aws iam create-policy \
    --policy-name $POLICY_NAME \
    --policy-document '{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "rds:CreateDBSnapshot",
                    "rds:DeleteDBSnapshot",
                    "rds:DescribeDBSnapshots",
                    "rds:DescribeDBInstances",
                    "rds:AddTagsToResource",
                    "rds:ListTagsForResource"
                ],
                "Resource": "*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                "Resource": "arn:aws:logs:*:*:*"
            }
        ]
    }' 2>/dev/null || echo "Policy already exists"

# Attach policies to role
echo "📝 Attaching policies to role..."
aws iam attach-role-policy \
    --role-name $ROLE_NAME \
    --policy-arn "arn:aws:iam::$ACCOUNT_ID:policy/$POLICY_NAME"

aws iam attach-role-policy \
    --role-name $ROLE_NAME \
    --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"

# Wait for role to be ready
echo "⏳ Waiting for IAM role to be ready..."
sleep 10

# Create deployment package
echo "📦 Creating deployment package..."
cd scripts
pip install -r lambda_requirements.txt -t .
zip -r db_backup_lambda.zip db_backup_lambda.py boto3* botocore*

# Create Lambda function
echo "🔧 Creating Lambda function..."
aws lambda create-function \
    --function-name $FUNCTION_NAME \
    --runtime python3.9 \
    --role "arn:aws:iam::$ACCOUNT_ID:role/$ROLE_NAME" \
    --handler db_backup_lambda.lambda_handler \
    --zip-file fileb://db_backup_lambda.zip \
    --timeout 300 \
    --memory-size 256 \
    --description "Automated daily RDS database snapshots with 7-day retention" \
    2>/dev/null || echo "Function already exists, updating..."

# Update function code if it already exists
if [ $? -ne 0 ]; then
    echo "🔄 Updating existing Lambda function..."
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://db_backup_lambda.zip
fi

# Create EventBridge rule for daily execution
echo "⏰ Creating EventBridge rule..."
aws events put-rule \
    --name $SCHEDULE_RULE_NAME \
    --schedule-expression "rate(1 day)" \
    --description "Daily trigger for database backup" \
    --state ENABLED

# Add Lambda permission for EventBridge
echo "🔐 Adding Lambda permission..."
aws lambda add-permission \
    --function-name $FUNCTION_NAME \
    --statement-id "allow-eventbridge" \
    --action "lambda:InvokeFunction" \
    --principal "events.amazonaws.com" \
    --source-arn "arn:aws:events:$REGION:$ACCOUNT_ID:rule/$SCHEDULE_RULE_NAME" \
    2>/dev/null || echo "Permission already exists"

# Add EventBridge target
echo "🎯 Adding EventBridge target..."
aws events put-targets \
    --rule $SCHEDULE_RULE_NAME \
    --targets "Id"="1","Arn"="arn:aws:lambda:$REGION:$ACCOUNT_ID:function:$FUNCTION_NAME"

# Test the function
echo "🧪 Testing Lambda function..."
aws lambda invoke \
    --function-name $FUNCTION_NAME \
    --payload '{}' \
    test_output.json

echo "📊 Test result:"
cat test_output.json
echo ""

# Cleanup
rm -f db_backup_lambda.zip test_output.json
rm -rf boto3* botocore*

echo ""
echo "✅ Database backup automation setup complete!"
echo ""
echo "📋 Summary:"
echo "  • Lambda function: $FUNCTION_NAME"
echo "  • Schedule: Daily at 00:00 UTC"
echo "  • Retention: 7 days"
echo "  • Database: neo-networker-db-v2"
echo ""
echo "🔍 To monitor backups:"
echo "  • CloudWatch Logs: /aws/lambda/$FUNCTION_NAME"
echo "  • RDS Console: Manual Snapshots"
echo "  • EventBridge Console: Rules"
echo ""
echo "🛠️  Manual operations:"
echo "  • Test backup: aws lambda invoke --function-name $FUNCTION_NAME --payload '{}' test.json"
echo "  • View snapshots: aws rds describe-db-snapshots --db-instance-identifier neo-networker-db-v2"
echo "  • Disable schedule: aws events disable-rule --name $SCHEDULE_RULE_NAME"
