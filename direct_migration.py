#!/usr/bin/env python3
"""
Direct Production Database Migration Script
This script connects directly to the production database and runs the migration.
"""

import os
import sys
import psycopg2
from psycopg2.extras import RealDictCursor
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def get_production_database_url():
    """Get production database URL"""
    # Production database URL from AWS RDS
    return "postgresql://postgres:NeoNetworker2024!@neo-networker-db.cqjqjqjqjqjq.us-east-1.rds.amazonaws.com:5432/neo_networker"

def connect_to_production():
    """Connect to the production database"""
    try:
        db_url = get_production_database_url()
        logger.info("Connecting to production database...")
        
        conn = psycopg2.connect(db_url)
        conn.autocommit = False
        return conn
    except Exception as e:
        logger.error(f"Failed to connect to production database: {e}")
        sys.exit(1)

def check_table_exists(cursor, table_name):
    """Check if a table exists"""
    cursor.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = %s
        );
    """, (table_name,))
    return cursor.fetchone()[0]

def get_table_columns(cursor, table_name):
    """Get column names for a table"""
    cursor.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = %s
        ORDER BY ordinal_position;
    """, (table_name,))
    return [row[0] for row in cursor.fetchall()]

def run_production_migration():
    """Run the production database migration"""
    conn = connect_to_production()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        logger.info("🚀 Starting PRODUCTION database migration...")
        logger.info("⚠️  WARNING: This will modify the production database structure!")
        
        # Step 1: Check current structure
        logger.info("📋 Checking current database structure...")
        
        tables_to_check = ['users', 'telegram_users', 'companies', 'shared_data', 'people', 'tasks', 'events']
        existing_tables = {}
        
        for table in tables_to_check:
            exists = check_table_exists(cursor, table)
            existing_tables[table] = exists
            logger.info(f"  - {table}: {'✅ EXISTS' if exists else '❌ NOT FOUND'}")
        
        # Step 2: Update User table structure
        if existing_tables['users']:
            logger.info("🔄 Updating User table structure...")
            
            user_columns = get_table_columns(cursor, 'users')
            logger.info(f"  - Current User columns: {', '.join(user_columns)}")
            
            # Add telegram_id column if it doesn't exist
            if 'telegram_id' not in user_columns:
                logger.info("  - Adding telegram_id column...")
                cursor.execute("ALTER TABLE users ADD COLUMN telegram_id VARCHAR(255);")
            
            # Add telegram_username column if it doesn't exist
            if 'telegram_username' not in user_columns:
                logger.info("  - Adding telegram_username column...")
                cursor.execute("ALTER TABLE users ADD COLUMN telegram_username VARCHAR(255);")
            
            # Add whatsapp_phone_number column if it doesn't exist
            if 'whatsapp_phone_number' not in user_columns:
                logger.info("  - Adding whatsapp_phone_number column...")
                cursor.execute("ALTER TABLE users ADD COLUMN whatsapp_phone_number VARCHAR(255);")
            
            # Rename columns to match our model
            if 'name' in user_columns and 'full_name' not in user_columns:
                logger.info("  - Renaming 'name' to 'full_name'...")
                cursor.execute("ALTER TABLE users RENAME COLUMN name TO full_name;")
            elif 'fullname' in user_columns and 'full_name' not in user_columns:
                logger.info("  - Renaming 'fullname' to 'full_name'...")
                cursor.execute("ALTER TABLE users RENAME COLUMN fullname TO full_name;")
            
            if 'password' in user_columns and 'password_hash' not in user_columns:
                logger.info("  - Renaming 'password' to 'password_hash'...")
                cursor.execute("ALTER TABLE users RENAME COLUMN password TO password_hash;")
        
        # Step 3: Migrate TelegramUser data if table exists
        if existing_tables['telegram_users'] and existing_tables['users']:
            logger.info("🔄 Migrating TelegramUser data to User table...")
            
            # Migrate data from telegram_users to users
            cursor.execute("""
                UPDATE users 
                SET telegram_id = tu.telegram_id,
                    telegram_username = tu.telegram_username
                FROM telegram_users tu 
                WHERE users.id = tu.user_id;
            """)
            
            migrated_count = cursor.rowcount
            logger.info(f"  - ✅ Migrated {migrated_count} telegram user records")
        
        # Step 4: Drop unnecessary tables
        tables_to_drop = ['telegram_users', 'companies', 'shared_data']
        
        for table in tables_to_drop:
            if existing_tables[table]:
                logger.info(f"🗑️  Dropping {table} table...")
                
                # Drop foreign key constraints first
                cursor.execute("""
                    SELECT constraint_name 
                    FROM information_schema.table_constraints 
                    WHERE table_name = %s AND constraint_type = 'FOREIGN KEY';
                """, (table,))
                
                foreign_keys = cursor.fetchall()
                for fk in foreign_keys:
                    logger.info(f"  - Dropping foreign key: {fk['constraint_name']}")
                    cursor.execute(f"ALTER TABLE {table} DROP CONSTRAINT {fk['constraint_name']};")
                
                cursor.execute(f"DROP TABLE {table} CASCADE;")
                logger.info(f"  - ✅ Dropped {table} table")
        
        # Step 5: Commit all changes
        conn.commit()
        logger.info("✅ All database changes committed successfully!")
        
        # Step 6: Verify final structure
        logger.info("🔍 Verifying final database structure...")
        final_tables = ['users', 'people', 'tasks', 'events']
        
        for table in final_tables:
            exists = check_table_exists(cursor, table)
            if exists:
                columns = get_table_columns(cursor, table)
                logger.info(f"  - {table}: ✅ EXISTS with columns: {', '.join(columns)}")
            else:
                logger.warning(f"  - {table}: ❌ NOT FOUND")
        
        logger.info("🎉 PRODUCTION database migration completed successfully!")
        
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    print("🚀 Neo Networker PRODUCTION Database Migration")
    print("=" * 50)
    print("⚠️  WARNING: This will modify the production database!")
    print("This script will:")
    print("  - Add telegram_id, telegram_username, whatsapp_phone_number to users table")
    print("  - Migrate data from telegram_users table to users table")
    print("  - Drop telegram_users, companies, and shared_data tables")
    print("  - Rename columns to match simplified model structure")
    print()
    
    confirm = input("Do you want to proceed? (yes/no): ").strip().lower()
    if confirm != 'yes':
        print("❌ Migration cancelled")
        sys.exit(0)
    
    run_production_migration()
