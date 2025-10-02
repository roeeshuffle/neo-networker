#!/bin/bash

# Database Backup Status Monitor
# Quick check of backup configuration and recent backups

echo "📊 Database Backup Status Report"
echo "================================"
echo ""

# Current database status
echo "🗄️  Database Status:"
aws rds describe-db-instances \
    --db-instance-identifier neo-networker-db-v2 \
    --query 'DBInstances[0].{Status:DBInstanceStatus,BackupRetentionPeriod:BackupRetentionPeriod,BackupWindow:PreferredBackupWindow,MaintenanceWindow:PreferredMaintenanceWindow}' \
    --output table

echo ""

# Check if automated backups are enabled
RETENTION=$(aws rds describe-db-instances \
    --db-instance-identifier neo-networker-db-v2 \
    --query 'DBInstances[0].BackupRetentionPeriod' \
    --output text)

if [ "$RETENTION" -gt 0 ]; then
    echo "✅ Automated Backups: ENABLED"
    echo "   • Retention Period: $RETENTION days"
    echo "   • Point-in-Time Recovery: Available"
    
    # Show recent automated backups
    echo ""
    echo "📸 Recent Automated Backups:"
    aws rds describe-db-snapshots \
        --db-instance-identifier neo-networker-db-v2 \
        --snapshot-type automated \
        --query 'DBSnapshots[0:5].{ID:DBSnapshotIdentifier,Created:SnapshotCreateTime,Status:Status}' \
        --output table
else
    echo "❌ Automated Backups: DISABLED"
    echo "   • Manual snapshots only"
    echo "   • No point-in-time recovery"
fi

echo ""

# Show manual snapshots
echo "📸 Manual Snapshots:"
aws rds describe-db-snapshots \
    --db-instance-identifier neo-networker-db-v2 \
    --snapshot-type manual \
    --query 'DBSnapshots[0:5].{ID:DBSnapshotIdentifier,Created:SnapshotCreateTime,Status:Status}' \
    --output table

echo ""
echo "🔍 Quick Commands:"
echo "  • Check status: ./scripts/check_backup_status.sh"
echo "  • Manual backup: ./scripts/manual_backup.sh"
echo "  • Enable auto backups: ./scripts/enable_automated_backups.sh"
echo "  • View all snapshots: aws rds describe-db-snapshots --db-instance-identifier neo-networker-db-v2"