#!/usr/bin/env python3
"""
Direct fix for production state_data column
"""

import psycopg2
from urllib.parse import urlparse

# Production database URL (you'll need to set this)
DATABASE_URL = "postgresql://postgres:NeoNetworker2024!@neo-networker-db-v2.c0d2k4qwgenr.us-east-1.rds.amazonaws.com:5432/postgres"

def fix_state_data_column():
    """Add state_data column to production database"""
    
    try:
        # Parse the URL
        parsed = urlparse(DATABASE_URL)
        host = parsed.hostname
        port = parsed.port or 5432
        database = parsed.path[1:]  # Remove leading slash
        username = parsed.username
        password = parsed.password
        
        print(f"🔗 Connecting to: {host}:{port}/{database}")
        
        # Connect to production database
        conn = psycopg2.connect(
            host=host,
            port=port,
            database=database,
            user=username,
            password=password
        )
        
        cursor = conn.cursor()
        
        # Check if column exists
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'profiles' AND column_name = 'state_data'
        """)
        
        if cursor.fetchone():
            print("✅ state_data column already exists")
        else:
            print("➕ Adding state_data column...")
            cursor.execute("ALTER TABLE profiles ADD COLUMN state_data JSON;")
            conn.commit()
            print("✅ state_data column added")
        
        # Verify
        cursor.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'profiles' AND column_name = 'state_data'
        """)
        
        result = cursor.fetchone()
        if result:
            print(f"✅ Verified: {result[0]} column exists with type {result[1]}")
        
        cursor.close()
        conn.close()
        print("🎉 Database fix completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    fix_state_data_column()
