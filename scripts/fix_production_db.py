#!/usr/bin/env python3
"""
Script to fix production database by adding WhatsApp columns
This script should be run in the production environment
"""

import os
import sys
import psycopg2
from urllib.parse import urlparse

def fix_production_database():
    print("🔧 Fixing production database - adding WhatsApp columns...")
    
    # Get database URL from environment (same as app.py)
    db_url = os.getenv('DATABASE_URL')
    
    if not db_url:
        print("❌ DATABASE_URL environment variable not found")
        print("Available environment variables:")
        for key, value in os.environ.items():
            if any(keyword in key.upper() for keyword in ['DATABASE', 'DB', 'POSTGRES', 'RDS', 'URL']):
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
        
        # Check current table structure
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'profiles' 
            ORDER BY column_name
        """)
        
        existing_columns = cursor.fetchall()
        print(f"📋 Current profiles table has {len(existing_columns)} columns")
        
        # Check if WhatsApp columns exist
        whatsapp_phone_exists = any(col[0] == 'whatsapp_phone' for col in existing_columns)
        preferred_platform_exists = any(col[0] == 'preferred_messaging_platform' for col in existing_columns)
        
        print(f"📱 whatsapp_phone exists: {whatsapp_phone_exists}")
        print(f"📱 preferred_messaging_platform exists: {preferred_platform_exists}")
        
        # Add whatsapp_phone column if missing
        if not whatsapp_phone_exists:
            print("➕ Adding whatsapp_phone column...")
            cursor.execute('ALTER TABLE profiles ADD COLUMN whatsapp_phone VARCHAR(20) UNIQUE;')
            print("✅ whatsapp_phone column added")
        else:
            print("✅ whatsapp_phone column already exists")
        
        # Add preferred_messaging_platform column if missing
        if not preferred_platform_exists:
            print("➕ Adding preferred_messaging_platform column...")
            cursor.execute("ALTER TABLE profiles ADD COLUMN preferred_messaging_platform VARCHAR(20) DEFAULT 'telegram';")
            print("✅ preferred_messaging_platform column added")
        else:
            print("✅ preferred_messaging_platform column already exists")
        
        # Commit changes
        conn.commit()
        print("🎉 Database fix completed successfully!")
        
        # Verify the fix
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'profiles' 
            AND column_name IN ('whatsapp_phone', 'preferred_messaging_platform')
            ORDER BY column_name
        """)
        
        new_columns = cursor.fetchall()
        print("\n📊 WhatsApp columns in profiles table:")
        for col in new_columns:
            print(f"  ✅ {col[0]}: {col[1]} (nullable: {col[2]}, default: {col[3]})")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error fixing database: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = fix_production_database()
    sys.exit(0 if success else 1)
