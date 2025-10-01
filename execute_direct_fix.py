#!/usr/bin/env python3
"""
Execute direct database fix using SQL script
"""

import os
import psycopg2
from psycopg2 import sql
import sys

def execute_direct_fix():
    print("🔧 Executing Direct Database Fix...")
    print("====================================")
    
    # Get database URL from environment
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL not configured")
        print("Please set DATABASE_URL environment variable")
        return False
    
    try:
        # Connect to database
        print("📡 Connecting to database...")
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        # Read SQL script
        print("📖 Reading SQL fix script...")
        with open('DIRECT_DATABASE_FIX.sql', 'r') as f:
            sql_script = f.read()
        
        # Execute SQL script
        print("⚡ Executing database fix...")
        cursor.execute(sql_script)
        
        # Commit changes
        conn.commit()
        
        # Verify the fix
        print("✅ Verifying fix...")
        
        # Check tasks table
        cursor.execute("""
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'tasks' 
            ORDER BY column_name;
        """)
        tasks_columns = cursor.fetchall()
        print(f"📋 Tasks table has {len(tasks_columns)} columns")
        
        # Check events table
        cursor.execute("""
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'events' 
            ORDER BY column_name;
        """)
        events_columns = cursor.fetchall()
        print(f"📋 Events table has {len(events_columns)} columns")
        
        # Close connection
        cursor.close()
        conn.close()
        
        print("✅ Direct database fix completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error executing direct fix: {e}")
        return False

if __name__ == "__main__":
    success = execute_direct_fix()
    if success:
        print("\n🎉 Database fix completed!")
        print("📋 NEXT STEPS:")
        print("1. Test the APIs again")
        print("2. Try creating tasks and fetching events")
    else:
        print("\n❌ Database fix failed!")
        sys.exit(1)
