#!/bin/bash

# Auto-enable RDS automated backups script
# Waits for database to be available, then enables 7-day retention

set -e

DB_INSTANCE_IDENTIFIER="neo-networker-db-v2"
MAX_ATTEMPTS=30
ATTEMPT=0

echo "🔄 Waiting for database to be available..."

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    STATUS=$(aws rds describe-db-instances \
        --db-instance-identifier "$DB_INSTANCE_IDENTIFIER" \
        --query 'DBInstances[0].DBInstanceStatus' \
        --output text)
    
    echo "📊 Database status: $STATUS (attempt $((ATTEMPT + 1))/$MAX_ATTEMPTS)"
    
    if [ "$STATUS" = "available" ]; then
        echo "✅ Database is now available! Enabling automated backups..."
        
        # Enable automated backups with 7-day retention
        aws rds modify-db-instance \
            --db-instance-identifier "$DB_INSTANCE_IDENTIFIER" \
            --backup-retention-period 7 \
            --preferred-backup-window "03:00-04:00" \
            --apply-immediately
        
        echo "✅ Automated backups enabled successfully!"
        echo "📋 Configuration:"
        echo "   • Retention Period: 7 days"
        echo "   • Backup Window: 03:00-04:00 UTC"
        echo "   • Point-in-Time Recovery: Enabled"
        
        # Verify the change
        echo ""
        echo "🔍 Verifying configuration..."
        aws rds describe-db-instances \
            --db-instance-identifier "$DB_INSTANCE_IDENTIFIER" \
            --query 'DBInstances[0].{Status:DBInstanceStatus,BackupRetentionPeriod:BackupRetentionPeriod,BackupWindow:PreferredBackupWindow}' \
            --output table
        
        exit 0
    fi
    
    ATTEMPT=$((ATTEMPT + 1))
    echo "⏳ Waiting 60 seconds before next check..."
    sleep 60
done

echo "❌ Timeout: Database did not become available within $MAX_ATTEMPTS attempts"
echo "💡 You can run this script again later when the database is available"
exit 1
