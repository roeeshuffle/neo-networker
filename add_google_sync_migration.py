#!/usr/bin/env python3
"""
Add google_sync column to events table in production
"""
import os
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Database connection details from environment variables
DATABASE_URL = os.getenv('DATABASE_URL')

if not DATABASE_URL:
    print("❌ Error: DATABASE_URL environment variable not set")
    sys.exit(1)

def add_google_sync_column():
    """Add google_sync column to events table"""
    try:
        print("🔧 Connecting to production database...")
        
        # Parse DATABASE_URL
        import urllib.parse
        parsed_url = urllib.parse.urlparse(DATABASE_URL)
        
        conn = psycopg2.connect(
            host=parsed_url.hostname,
            port=parsed_url.port,
            database=parsed_url.path[1:],  # Remove leading slash
            user=parsed_url.username,
            password=parsed_url.password,
            sslmode='require'
        )
        
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        print("✅ Connected to production database")
        
        # Check if google_sync column already exists
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'events' AND column_name = 'google_sync'
        """)
        
        if cursor.fetchone():
            print("✅ google_sync column already exists in events table")
        else:
            print("🔧 Adding google_sync column to events table...")
            cursor.execute("ALTER TABLE events ADD COLUMN google_sync BOOLEAN DEFAULT TRUE")
            print("✅ google_sync column added successfully")
        
        # Verify the column was added
        cursor.execute("""
            SELECT column_name, data_type, column_default
            FROM information_schema.columns 
            WHERE table_name = 'events' AND column_name = 'google_sync'
        """)
        
        result = cursor.fetchone()
        if result:
            print(f"✅ Verification: google_sync column exists - {result[0]} ({result[1]}, default: {result[2]})")
        else:
            print("❌ Error: google_sync column not found after migration")
            return False
        
        cursor.close()
        conn.close()
        
        print("🎉 Database migration completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error running migration: {e}")
        return False

if __name__ == "__main__":
    success = add_google_sync_column()
    sys.exit(0 if success else 1)
