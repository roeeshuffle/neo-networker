#!/usr/bin/env python3
"""
AWS Lambda function for automated RDS database snapshots
Creates daily snapshots and manages 7-day retention policy
"""

import json
import boto3
import logging
from datetime import datetime, timedelta
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
rds_client = boto3.client('rds')

# Configuration
DB_INSTANCE_IDENTIFIER = 'neo-networker-db-v2'
RETENTION_DAYS = 7

def lambda_handler(event, context):
    """
    Main Lambda handler for database backup operations
    """
    try:
        # Create daily snapshot
        snapshot_id = create_daily_snapshot()
        
        # Clean up old snapshots
        deleted_snapshots = cleanup_old_snapshots()
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Database backup completed successfully',
                'snapshot_id': snapshot_id,
                'deleted_snapshots': deleted_snapshots,
                'timestamp': datetime.utcnow().isoformat()
            })
        }
        
    except Exception as e:
        logger.error(f"Error in backup process: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            })
        }

def create_daily_snapshot():
    """
    Create a daily snapshot of the RDS instance
    """
    timestamp = datetime.utcnow().strftime('%Y-%m-%d-%H-%M-%S')
    snapshot_id = f"{DB_INSTANCE_IDENTIFIER}-daily-{timestamp}"
    
    try:
        logger.info(f"Creating snapshot: {snapshot_id}")
        
        response = rds_client.create_db_snapshot(
            DBSnapshotIdentifier=snapshot_id,
            DBInstanceIdentifier=DB_INSTANCE_IDENTIFIER,
            Tags=[
                {
                    'Key': 'BackupType',
                    'Value': 'Daily'
                },
                {
                    'Key': 'CreatedBy',
                    'Value': 'Lambda'
                },
                {
                    'Key': 'RetentionDays',
                    'Value': str(RETENTION_DAYS)
                }
            ]
        )
        
        logger.info(f"Snapshot creation initiated: {snapshot_id}")
        return snapshot_id
        
    except ClientError as e:
        logger.error(f"Failed to create snapshot: {e}")
        raise

def cleanup_old_snapshots():
    """
    Delete snapshots older than RETENTION_DAYS
    """
    cutoff_date = datetime.utcnow() - timedelta(days=RETENTION_DAYS)
    deleted_snapshots = []
    
    try:
        # Get all snapshots for this DB instance
        paginator = rds_client.get_paginator('describe_db_snapshots')
        page_iterator = paginator.paginate(
            DBInstanceIdentifier=DB_INSTANCE_IDENTIFIER,
            SnapshotType='manual'  # Only manual snapshots (not automated)
        )
        
        for page in page_iterator:
            for snapshot in page['DBSnapshots']:
                snapshot_id = snapshot['DBSnapshotIdentifier']
                snapshot_time = snapshot['SnapshotCreateTime'].replace(tzinfo=None)
                
                # Check if snapshot is older than retention period
                if snapshot_time < cutoff_date:
                    # Check if it's a daily backup snapshot
                    if 'daily' in snapshot_id.lower():
                        try:
                            logger.info(f"Deleting old snapshot: {snapshot_id}")
                            rds_client.delete_db_snapshot(
                                DBSnapshotIdentifier=snapshot_id
                            )
                            deleted_snapshots.append(snapshot_id)
                            logger.info(f"Successfully deleted snapshot: {snapshot_id}")
                            
                        except ClientError as e:
                            logger.error(f"Failed to delete snapshot {snapshot_id}: {e}")
        
        logger.info(f"Cleanup completed. Deleted {len(deleted_snapshots)} snapshots")
        return deleted_snapshots
        
    except ClientError as e:
        logger.error(f"Failed to cleanup snapshots: {e}")
        raise

def get_snapshot_status(snapshot_id):
    """
    Get the status of a specific snapshot
    """
    try:
        response = rds_client.describe_db_snapshots(
            DBSnapshotIdentifier=snapshot_id
        )
        
        if response['DBSnapshots']:
            return response['DBSnapshots'][0]['Status']
        return None
        
    except ClientError as e:
        logger.error(f"Failed to get snapshot status: {e}")
        return None
