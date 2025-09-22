#!/usr/bin/env python3
import os
import psycopg2

# Get database URL from environment
database_url = os.getenv('DATABASE_URL')
if not database_url:
    print("❌ DATABASE_URL not set")
    exit(1)

try:
    conn = psycopg2.connect(database_url)
    conn.autocommit = True
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
        print("✅ state_data column added")
    
    cursor.close()
    conn.close()
    print("🎉 Done!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    exit(1)
