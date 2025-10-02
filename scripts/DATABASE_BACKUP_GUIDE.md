# Database Backup Solution
# Automated daily snapshots with 7-day retention

## Manual Commands

### 1. Create Daily Snapshot
```bash
# Get current timestamp
TIMESTAMP=$(date +%Y-%m-%d-%H-%M-%S)
SNAPSHOT_ID="neo-networker-db-v2-daily-${TIMESTAMP}"

# Create snapshot
aws rds create-db-snapshot \
    --db-instance-identifier neo-networker-db-v2 \
    --db-snapshot-identifier "$SNAPSHOT_ID" \
    --tags Key=BackupType,Value=Daily Key=CreatedBy,Value=Manual Key=RetentionDays,Value=7
```

### 2. List Current Snapshots
```bash
aws rds describe-db-snapshots \
    --db-instance-identifier neo-networker-db-v2 \
    --snapshot-type manual \
    --query "DBSnapshots[?contains(DBSnapshotIdentifier, 'daily')].{ID:DBSnapshotIdentifier,Created:SnapshotCreateTime,Status:Status}" \
    --output table
```

### 3. Clean Up Old Snapshots (7+ days)
```bash
# Get cutoff date (7 days ago)
CUTOFF_DATE=$(date -d "7 days ago" --iso-8601)

# List snapshots to delete
aws rds describe-db-snapshots \
    --db-instance-identifier neo-networker-db-v2 \
    --snapshot-type manual \
    --query "DBSnapshots[?contains(DBSnapshotIdentifier, 'daily') && SnapshotCreateTime < '$CUTOFF_DATE'].DBSnapshotIdentifier" \
    --output text

# Delete old snapshots (replace SNAPSHOT_ID with actual IDs from above)
aws rds delete-db-snapshot --db-snapshot-identifier "SNAPSHOT_ID"
```

## Automated Solution (Cron)

### 1. Create Backup Script
```bash
#!/bin/bash
# File: /home/ec2-user/db_backup.sh

TIMESTAMP=$(date +%Y-%m-%d-%H-%M-%S)
SNAPSHOT_ID="neo-networker-db-v2-daily-${TIMESTAMP}"
CUTOFF_DATE=$(date -d "7 days ago" --iso-8601)

# Create snapshot
aws rds create-db-snapshot \
    --db-instance-identifier neo-networker-db-v2 \
    --db-snapshot-identifier "$SNAPSHOT_ID" \
    --tags Key=BackupType,Value=Daily Key=CreatedBy,Value=Cron Key=RetentionDays,Value=7

# Clean up old snapshots
OLD_SNAPSHOTS=$(aws rds describe-db-snapshots \
    --db-instance-identifier neo-networker-db-v2 \
    --snapshot-type manual \
    --query "DBSnapshots[?contains(DBSnapshotIdentifier, 'daily') && SnapshotCreateTime < '$CUTOFF_DATE'].DBSnapshotIdentifier" \
    --output text)

for snapshot in $OLD_SNAPSHOTS; do
    aws rds delete-db-snapshot --db-snapshot-identifier "$snapshot"
done

echo "$(date): Backup completed - $SNAPSHOT_ID" >> /var/log/db_backup.log
```

### 2. Set Up Cron Job
```bash
# Edit crontab
crontab -e

# Add this line to run daily at 2 AM
0 2 * * * /home/ec2-user/db_backup.sh
```

### 3. Make Script Executable
```bash
chmod +x /home/ec2-user/db_backup.sh
```

## Monitoring Commands

### Check Backup Status
```bash
# List all daily snapshots
aws rds describe-db-snapshots \
    --db-instance-identifier neo-networker-db-v2 \
    --snapshot-type manual \
    --query "DBSnapshots[?contains(DBSnapshotIdentifier, 'daily')].{ID:DBSnapshotIdentifier,Created:SnapshotCreateTime,Status:Status,Size:AllocatedStorage}" \
    --output table
```

### Check Backup Logs
```bash
tail -f /var/log/db_backup.log
```

## Cost Estimation

- **Snapshot Storage**: ~$0.095 per GB per month
- **Typical DB Size**: 20-50 GB
- **7 Days Retention**: ~$0.13-0.33 per month
- **Total Monthly Cost**: ~$1-2 for automated backups

## Recovery Commands

### Restore from Snapshot
```bash
# List available snapshots
aws rds describe-db-snapshots \
    --db-instance-identifier neo-networker-db-v2 \
    --snapshot-type manual \
    --query "DBSnapshots[?contains(DBSnapshotIdentifier, 'daily')].{ID:DBSnapshotIdentifier,Created:SnapshotCreateTime}" \
    --output table

# Restore from snapshot (creates new DB instance)
aws rds restore-db-instance-from-db-snapshot \
    --db-instance-identifier neo-networker-db-restored \
    --db-snapshot-identifier "SNAPSHOT_ID"
```

## Alternative: AWS RDS Automated Backups

Your RDS instance already has automated backups enabled:
- **Backup Retention**: 7 days (configurable)
- **Backup Window**: Daily during maintenance window
- **Point-in-Time Recovery**: Available for last 7 days
- **Cost**: Included in RDS pricing

To check current settings:
```bash
aws rds describe-db-instances \
    --db-instance-identifier neo-networker-db-v2 \
    --query 'DBInstances[0].{BackupRetentionPeriod:BackupRetentionPeriod,BackupWindow:PreferredBackupWindow,MaintenanceWindow:PreferredMaintenanceWindow}'
```
