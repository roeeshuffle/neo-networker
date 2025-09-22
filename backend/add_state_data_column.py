#!/usr/bin/env python3
"""
Script to add state_data column to production database
"""

import os
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def add_state_data_column():
    """Add state_data column to profiles table"""
    
    # Get database URL from environment
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL environment variable not set")
        return False
    
    try:
        # Connect to database
        print("🔌 Connecting to production database...")
        conn = psycopg2.connect(database_url)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Check if column already exists
        print("🔍 Checking if state_data column exists...")
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'profiles' 
            AND column_name = 'state_data'
        """)
        
        if cursor.fetchone():
            print("✅ state_data column already exists")
            return True
        
        # Add the column
        print("➕ Adding state_data column to profiles table...")
        cursor.execute("""
            ALTER TABLE profiles 
            ADD COLUMN state_data JSON
        """)
        
        print("✅ Successfully added state_data column to profiles table")
        
        # Verify the column was added
        cursor.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'profiles' 
            AND column_name = 'state_data'
        """)
        
        result = cursor.fetchone()
        if result:
            print(f"✅ Verified: {result[0]} column exists with type {result[1]}")
        else:
            print("❌ Column verification failed")
            return False
            
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error adding state_data column: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Adding state_data column to production database...")
    success = add_state_data_column()
    if success:
        print("🎉 Database update completed successfully!")
    else:
        print("💥 Database update failed!")
        sys.exit(1)
