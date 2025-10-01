#!/usr/bin/env python3
"""
Script to run database fix in production environment
This will be executed by the production app to add WhatsApp columns
"""

import os
import sys
import psycopg2
from urllib.parse import urlparse

def main():
    print("🔧 Running database fix in production...")
    
    # Get database URL from environment (same as app.py)
    db_url = os.getenv('DATABASE_URL')
    
    if not db_url:
        print("❌ DATABASE_URL not found in environment")
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
        
        # Check if columns already exist
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'profiles' 
            AND column_name IN ('whatsapp_phone', 'preferred_messaging_platform', 'state_data')
        """)
        
        existing_columns = [row[0] for row in cursor.fetchall()]
        print(f"📋 Existing columns: {existing_columns}")
        
        # Add whatsapp_phone column if missing
        if 'whatsapp_phone' not in existing_columns:
            print("➕ Adding whatsapp_phone column...")
            cursor.execute('ALTER TABLE profiles ADD COLUMN whatsapp_phone VARCHAR(20) UNIQUE;')
            print("✅ whatsapp_phone column added")
        else:
            print("✅ whatsapp_phone column already exists")
        
        # Add preferred_messaging_platform column if missing
        if 'preferred_messaging_platform' not in existing_columns:
            print("➕ Adding preferred_messaging_platform column...")
            cursor.execute("ALTER TABLE profiles ADD COLUMN preferred_messaging_platform VARCHAR(20) DEFAULT 'telegram';")
            print("✅ preferred_messaging_platform column added")
        else:
            print("✅ preferred_messaging_platform column already exists")
        
        # Add state_data column if missing
        if 'state_data' not in existing_columns:
            print("➕ Adding state_data column...")
            cursor.execute("ALTER TABLE profiles ADD COLUMN state_data JSON;")
            print("✅ state_data column added")
        else:
            print("✅ state_data column already exists")
        
        # Force add state_data column (in case the check failed)
        try:
            print("🔧 Force adding state_data column...")
            cursor.execute("ALTER TABLE profiles ADD COLUMN state_data JSON;")
            print("✅ state_data column force added")
        except Exception as e:
            if "already exists" in str(e):
                print("✅ state_data column already exists (force check)")
            else:
                print(f"⚠️ Force add failed: {e}")
        
        # Commit changes
        conn.commit()
        print("🎉 Database fix completed successfully!")
        
        # Verify the fix
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'profiles' 
            AND column_name IN ('whatsapp_phone', 'preferred_messaging_platform', 'state_data')
            ORDER BY column_name
        """)
        
        new_columns = cursor.fetchall()
        print("\n📊 Voice support columns in profiles table:")
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
    success = main()
    sys.exit(0 if success else 1)
