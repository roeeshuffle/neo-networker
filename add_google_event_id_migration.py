#!/usr/bin/env python3
"""
Migration script to add google_event_id column to events table
"""
import os
import sys
import psycopg2
import urllib.parse

# Load environment variables
DATABASE_URL = os.getenv('DATABASE_URL')

if not DATABASE_URL:
    print("Error: DATABASE_URL environment variable not set.")
    sys.exit(1)

print("🔧 Adding google_event_id column to events table...")

try:
    # Parse the DATABASE_URL
    parsed_url = urllib.parse.urlparse(DATABASE_URL)
    
    conn = psycopg2.connect(
        host=parsed_url.hostname,
        port=parsed_url.port,
        database=parsed_url.path[1:],
        user=parsed_url.username,
        password=parsed_url.password,
        sslmode='require'
    )
    
    cursor = conn.cursor()
    
    # Check if the column already exists
    cursor.execute("""
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name='events' AND column_name='google_event_id'
        );
    """)
    
    column_exists = cursor.fetchone()[0]
    
    if column_exists:
        print("ℹ️ google_event_id column already exists in events table.")
    else:
        # Add the column
        cursor.execute("ALTER TABLE events ADD COLUMN google_event_id VARCHAR(255)")
        conn.commit()
        print("✅ google_event_id column added successfully")
    
    cursor.close()
    conn.close()
    print("🎉 Migration completed successfully!")

except Exception as e:
    print(f"💥 Error during migration: {e}")
    sys.exit(1)
