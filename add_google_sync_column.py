#!/usr/bin/env python3
"""
Add google_sync column to events table
Usage: python3 add_google_sync_column.py "your_database_url_here"
"""
import os
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def add_google_sync_column(database_url):
    """Add google_sync column to events table"""
    try:
        print("🔧 Adding google_sync column to events table...")
        
        # Parse DATABASE_URL
        import urllib.parse
        parsed_url = urllib.parse.urlparse(database_url)
        
        # Hide password in display
        display_url = database_url.replace(parsed_url.password, "***")
        print(f"📊 Database: {display_url}")
        
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
            print("✅ google_sync column already exists")
        else:
            print("🔧 Adding google_sync column...")
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
        
        print("🎉 Migration completed successfully!")
        print("📋 Next steps:")
        print("   1. The google_sync column has been added to the events table")
        print("   2. You can now re-enable the Google Calendar sync toggle functionality")
        print("   3. All existing events will have google_sync = TRUE by default")
        return True
        
    except Exception as e:
        print(f"❌ Error running migration: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("❌ Error: Please provide DATABASE_URL as argument")
        print("Usage: python3 add_google_sync_column.py 'postgresql://user:password@host:port/database'")
        sys.exit(1)
    
    database_url = sys.argv[1]
    success = add_google_sync_column(database_url)
    sys.exit(0 if success else 1)
