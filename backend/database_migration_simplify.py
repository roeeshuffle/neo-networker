#!/usr/bin/env python3
"""
Database Migration Script: Simplify Models
This script will:
1. Remove unnecessary columns from profiles table
2. Drop companies table
3. Drop shared_data table
4. Rename whatsapp_phone to whatsapp_phone_number
"""

import os
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def get_db_connection():
    """Get database connection from environment variables"""
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        raise ValueError("DATABASE_URL environment variable not set")
    
    # Parse the DATABASE_URL
    # Format: postgresql://user:password@host:port/database
    import urllib.parse as urlparse
    url = urlparse.urlparse(database_url)
    
    conn = psycopg2.connect(
        database=url.path[1:],  # Remove leading slash
        user=url.username,
        password=url.password,
        host=url.hostname,
        port=url.port
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    return conn

def run_migration():
    """Run the database migration"""
    print("🚀 Starting database migration: Simplify Models")
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        print("📊 Connected to database successfully")
        
        # 1. Drop tables that are no longer needed
        print("🗑️ Dropping unused tables...")
        
        # Drop shared_data table
        try:
            cursor.execute("DROP TABLE IF EXISTS shared_data CASCADE;")
            print("✅ Dropped shared_data table")
        except Exception as e:
            print(f"⚠️ Error dropping shared_data table: {e}")
        
        # Drop companies table
        try:
            cursor.execute("DROP TABLE IF EXISTS companies CASCADE;")
            print("✅ Dropped companies table")
        except Exception as e:
            print(f"⚠️ Error dropping companies table: {e}")
        
        # 2. Rename whatsapp_phone to whatsapp_phone_number
        print("🔄 Renaming whatsapp_phone column...")
        try:
            cursor.execute("ALTER TABLE profiles RENAME COLUMN whatsapp_phone TO whatsapp_phone_number;")
            print("✅ Renamed whatsapp_phone to whatsapp_phone_number")
        except Exception as e:
            print(f"⚠️ Error renaming column (might already be renamed): {e}")
        
        # 3. Remove unnecessary columns from profiles table
        print("🧹 Removing unnecessary columns from profiles table...")
        
        columns_to_remove = [
            'approved_by',
            'approved_at', 
            'avatar_url',
            'provider',
            'preferred_messaging_platform',
            'state_data',
            'current_state',
            'telegram_username',
            'google_id',
            'google_refresh_token',
            'google_access_token',
            'google_token_expires_at',
            'google_contacts_synced_at',
            'google_calendar_synced_at'
        ]
        
        for column in columns_to_remove:
            try:
                cursor.execute(f"ALTER TABLE profiles DROP COLUMN IF EXISTS {column};")
                print(f"✅ Removed column: {column}")
            except Exception as e:
                print(f"⚠️ Error removing column {column}: {e}")
        
        # 4. Make full_name NOT NULL
        print("🔧 Making full_name NOT NULL...")
        try:
            cursor.execute("ALTER TABLE profiles ALTER COLUMN full_name SET NOT NULL;")
            print("✅ Made full_name NOT NULL")
        except Exception as e:
            print(f"⚠️ Error making full_name NOT NULL: {e}")
        
        print("🎉 Database migration completed successfully!")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False
    finally:
        if 'conn' in locals():
            conn.close()
    
    return True

if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1)
