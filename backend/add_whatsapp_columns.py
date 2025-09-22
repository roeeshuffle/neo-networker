#!/usr/bin/env python3
"""
Script to add WhatsApp columns to production database
Run this script to manually add the missing columns
"""

import os
import psycopg2
from urllib.parse import urlparse

def add_whatsapp_columns():
    # Try different possible database URL environment variables
    possible_urls = [
        os.getenv('DATABASE_URL'),
        os.getenv('DB_URL'),
        os.getenv('POSTGRES_URL'),
        os.getenv('POSTGRESQL_URL'),
        # AWS App Runner might use different names
        os.getenv('RDS_DATABASE_URL'),
        os.getenv('DB_CONNECTION_STRING'),
    ]
    
    db_url = None
    for url in possible_urls:
        if url:
            db_url = url
            break
    
    if not db_url:
        print("❌ No database URL found in environment variables")
        print("Available environment variables:")
        for key, value in os.environ.items():
            if any(keyword in key.upper() for keyword in ['DATABASE', 'DB', 'POSTGRES', 'RDS']):
                print(f"  {key}: {value[:50]}...")
        return False
    
    try:
        # Parse the URL
        parsed = urlparse(db_url)
        host = parsed.hostname
        port = parsed.port or 5432
        database = parsed.path[1:]  # Remove leading slash
        username = parsed.username
        password = parsed.password
        
        print(f"🔗 Connecting to production database: {host}:{port}/{database}")
        
        # Connect to production database
        conn = psycopg2.connect(
            host=host,
            port=port,
            database=database,
            user=username,
            password=password
        )
        
        cursor = conn.cursor()
        
        # Check if columns already exist
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'profiles' 
            AND column_name IN ('whatsapp_phone', 'preferred_messaging_platform')
        """)
        
        existing_columns = [row[0] for row in cursor.fetchall()]
        print(f"📋 Existing WhatsApp columns: {existing_columns}")
        
        # Add whatsapp_phone column if it doesn't exist
        if 'whatsapp_phone' not in existing_columns:
            print("➕ Adding whatsapp_phone column...")
            cursor.execute('ALTER TABLE profiles ADD COLUMN whatsapp_phone VARCHAR(20) UNIQUE;')
            print("✅ whatsapp_phone column added")
        else:
            print("✅ whatsapp_phone column already exists")
        
        # Add preferred_messaging_platform column if it doesn't exist
        if 'preferred_messaging_platform' not in existing_columns:
            print("➕ Adding preferred_messaging_platform column...")
            cursor.execute("ALTER TABLE profiles ADD COLUMN preferred_messaging_platform VARCHAR(20) DEFAULT 'telegram';")
            print("✅ preferred_messaging_platform column added")
        else:
            print("✅ preferred_messaging_platform column already exists")
        
        # Commit changes
        conn.commit()
        print("🎉 WhatsApp columns added successfully to production database!")
        
        # Verify the columns exist
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'profiles' 
            AND column_name IN ('whatsapp_phone', 'preferred_messaging_platform')
            ORDER BY column_name
        """)
        
        columns = cursor.fetchall()
        print("\n📊 Column details:")
        for col in columns:
            print(f"  {col[0]}: {col[1]} (nullable: {col[2]}, default: {col[3]})")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error adding WhatsApp columns: {e}")
        return False

if __name__ == "__main__":
    add_whatsapp_columns()
