#!/usr/bin/env python3
"""
Production Database Migration Script
This script will migrate the production database to match the simplified model structure.
"""

import os
import sys
import psycopg2
from psycopg2.extras import RealDictCursor
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def get_database_url():
    """Get database URL from environment or use default"""
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        logger.error("DATABASE_URL environment variable not set")
        sys.exit(1)
    return db_url

def connect_to_database():
    """Connect to the production database"""
    try:
        db_url = get_database_url()
        logger.info("Connecting to production database...")
        
        # Parse the database URL
        conn = psycopg2.connect(db_url)
        conn.autocommit = False
        return conn
    except Exception as e:
        logger.error(f"Failed to connect to database: {e}")
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

def migrate_database():
    """Main migration function"""
    conn = connect_to_database()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        logger.info("🚀 Starting production database migration...")
        
        # Step 1: Check current database structure
        logger.info("📋 Checking current database structure...")
        
        tables_to_check = ['users', 'telegram_users', 'companies', 'shared_data', 'people', 'tasks', 'events']
        existing_tables = {}
        
        for table in tables_to_check:
            exists = check_table_exists(cursor, table)
            existing_tables[table] = exists
            logger.info(f"  - {table}: {'✅ EXISTS' if exists else '❌ NOT FOUND'}")
        
        # Step 2: Migrate TelegramUser data to User table
        if existing_tables['telegram_users'] and existing_tables['users']:
            logger.info("🔄 Migrating TelegramUser data to User table...")
            
            # Check if telegram_id column exists in users table
            user_columns = get_table_columns(cursor, 'users')
            
            if 'telegram_id' not in user_columns:
                logger.info("  - Adding telegram_id column to users table...")
                cursor.execute("ALTER TABLE users ADD COLUMN telegram_id VARCHAR(255);")
                
            if 'telegram_username' not in user_columns:
                logger.info("  - Adding telegram_username column to users table...")
                cursor.execute("ALTER TABLE users ADD COLUMN telegram_username VARCHAR(255);")
            
            # Migrate data from telegram_users to users
            logger.info("  - Migrating telegram user data...")
            cursor.execute("""
                UPDATE users 
                SET telegram_id = tu.telegram_id,
                    telegram_username = tu.telegram_username
                FROM telegram_users tu 
                WHERE users.id = tu.user_id;
            """)
            
            migrated_count = cursor.rowcount
            logger.info(f"  - ✅ Migrated {migrated_count} telegram user records")
        
        # Step 3: Add whatsapp_phone_number column to users if it doesn't exist
        if existing_tables['users']:
            logger.info("🔄 Checking whatsapp_phone_number column...")
            user_columns = get_table_columns(cursor, 'users')
            
            if 'whatsapp_phone_number' not in user_columns:
                logger.info("  - Adding whatsapp_phone_number column to users table...")
                cursor.execute("ALTER TABLE users ADD COLUMN whatsapp_phone_number VARCHAR(255);")
            else:
                logger.info("  - ✅ whatsapp_phone_number column already exists")
        
        # Step 4: Update User table structure to match our simplified model
        if existing_tables['users']:
            logger.info("🔄 Updating User table structure...")
            
            # Check if full_name column exists, if not rename from other possible names
            user_columns = get_table_columns(cursor, 'users')
            
            if 'full_name' not in user_columns:
                if 'name' in user_columns:
                    logger.info("  - Renaming 'name' column to 'full_name'...")
                    cursor.execute("ALTER TABLE users RENAME COLUMN name TO full_name;")
                elif 'fullname' in user_columns:
                    logger.info("  - Renaming 'fullname' column to 'full_name'...")
                    cursor.execute("ALTER TABLE users RENAME COLUMN fullname TO full_name;")
                else:
                    logger.info("  - Adding 'full_name' column...")
                    cursor.execute("ALTER TABLE users ADD COLUMN full_name VARCHAR(255);")
            
            # Ensure password_hash column exists
            if 'password_hash' not in user_columns:
                if 'password' in user_columns:
                    logger.info("  - Renaming 'password' column to 'password_hash'...")
                    cursor.execute("ALTER TABLE users RENAME COLUMN password TO password_hash;")
                else:
                    logger.info("  - Adding 'password_hash' column...")
                    cursor.execute("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);")
        
        # Step 5: Drop unnecessary tables
        tables_to_drop = ['telegram_users', 'companies', 'shared_data']
        
        for table in tables_to_drop:
            if existing_tables[table]:
                logger.info(f"🗑️  Dropping {table} table...")
                
                # Check for foreign key constraints
                cursor.execute("""
                    SELECT constraint_name 
                    FROM information_schema.table_constraints 
                    WHERE table_name = %s AND constraint_type = 'FOREIGN KEY';
                """, (table,))
                
                foreign_keys = cursor.fetchall()
                for fk in foreign_keys:
                    logger.info(f"  - Dropping foreign key constraint: {fk['constraint_name']}")
                    cursor.execute(f"ALTER TABLE {table} DROP CONSTRAINT {fk['constraint_name']};")
                
                cursor.execute(f"DROP TABLE {table} CASCADE;")
                logger.info(f"  - ✅ Dropped {table} table")
        
        # Step 6: Commit all changes
        conn.commit()
        logger.info("✅ All database changes committed successfully!")
        
        # Step 7: Verify final structure
        logger.info("🔍 Verifying final database structure...")
        final_tables = ['users', 'people', 'tasks', 'events']
        
        for table in final_tables:
            exists = check_table_exists(cursor, table)
            if exists:
                columns = get_table_columns(cursor, table)
                logger.info(f"  - {table}: ✅ EXISTS with columns: {', '.join(columns)}")
            else:
                logger.warning(f"  - {table}: ❌ NOT FOUND")
        
        logger.info("🎉 Database migration completed successfully!")
        
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    migrate_database()
