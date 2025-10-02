#!/bin/bash

# Simple Database Backup Script
# Creates daily snapshots and manages 7-day retention

set -e

# Configuration
DB_INSTANCE_IDENTIFIER="neo-networker-db-v2"
RETENTION_DAYS=7
TIMESTAMP=$(date +%Y-%m-%d-%H-%M-%S)
SNAPSHOT_ID="${DB_INSTANCE_IDENTIFIER}-daily-${TIMESTAMP}"

echo "🗄️  Creating database snapshot: $SNAPSHOT_ID"

# Create snapshot
aws rds create-db-snapshot \
    --db-instance-identifier "$DB_INSTANCE_IDENTIFIER" \
    --db-snapshot-identifier "$SNAPSHOT_ID" \
    --tags Key=BackupType,Value=Daily Key=CreatedBy,Value=Manual Key=RetentionDays,Value="$RETENTION_DAYS"

echo "✅ Snapshot creation initiated: $SNAPSHOT_ID"

# Wait a moment for the snapshot to be created
sleep 5

# Clean up old snapshots
echo "🧹 Cleaning up snapshots older than $RETENTION_DAYS days..."

# Get cutoff date
CUTOFF_DATE=$(date -d "$RETENTION_DAYS days ago" --iso-8601)

# Get all manual snapshots for this DB instance
SNAPSHOTS=$(aws rds describe-db-snapshots \
    --db-instance-identifier "$DB_INSTANCE_IDENTIFIER" \
    --snapshot-type manual \
    --query "DBSnapshots[?contains(DBSnapshotIdentifier, 'daily') && SnapshotCreateTime < '$CUTOFF_DATE'].DBSnapshotIdentifier" \
    --output text)

if [ -n "$SNAPSHOTS" ]; then
    echo "📋 Found old snapshots to delete:"
    echo "$SNAPSHOTS"
    
    for snapshot in $SNAPSHOTS; do
        echo "🗑️  Deleting snapshot: $snapshot"
        aws rds delete-db-snapshot --db-snapshot-identifier "$snapshot"
    done
    
    echo "✅ Cleanup completed"
else
    echo "ℹ️  No old snapshots found to delete"
fi

echo ""
echo "📊 Current snapshots:"
aws rds describe-db-snapshots \
    --db-instance-identifier "$DB_INSTANCE_IDENTIFIER" \
    --snapshot-type manual \
    --query "DBSnapshots[?contains(DBSnapshotIdentifier, 'daily')].{ID:DBSnapshotIdentifier,Created:SnapshotCreateTime,Status:Status}" \
    --output table

echo ""
echo "✅ Backup process completed!"
echo "📸 New snapshot: $SNAPSHOT_ID"
echo "🗑️  Retention: $RETENTION_DAYS days"
