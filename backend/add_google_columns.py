#!/usr/bin/env python3
"""
Script to add Google OAuth columns to the profiles table
"""
import os
import psycopg2
from sqlalchemy import create_engine, text

def add_google_columns():
    """Add Google OAuth columns to the profiles table"""
    try:
        # Get database URL from environment
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            print("❌ DATABASE_URL not found")
            return False
            
        print(f"🔍 Database URL: {database_url[:20]}...")
        
        # Create SQLAlchemy engine
        engine = create_engine(database_url)
        
        # SQL to add Google OAuth columns
        sql_commands = [
            "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_id VARCHAR(100);",
            "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;",
            "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_access_token TEXT;",
            "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_token_expires_at TIMESTAMP;",
            "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_contacts_synced_at TIMESTAMP;",
            "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_calendar_synced_at TIMESTAMP;",
            "CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_google_id ON profiles(google_id);"
        ]
        
        # Execute each command
        with engine.connect() as conn:
            for sql in sql_commands:
                print(f"🔧 Executing: {sql}")
                conn.execute(text(sql))
                conn.commit()
        
        print("✅ Google OAuth columns added successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error adding Google OAuth columns: {e}")
        return False

if __name__ == "__main__":
    success = add_google_columns()
    exit(0 if success else 1)
