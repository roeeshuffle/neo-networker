#!/usr/bin/env python3
"""
Script to add custom_fields column to profiles table
"""
import psycopg2
import os
import sys

def add_custom_fields_column():
    """Add custom_fields column to profiles table"""
    
    # Database connection parameters
    # These should match your RDS configuration
    host = "neo-networker-db-v2.c0d2k4qwgenr.us-east-1.rds.amazonaws.com"
    port = 5432
    database = "neo_networker"
    user = "neo_networker_user"
    password = "NeoNetworker2024!"
    
    try:
        # Connect to database with SSL
        conn = psycopg2.connect(
            host=host,
            port=port,
            database=database,
            user=user,
            password=password,
            sslmode='require'
        )
        
        cursor = conn.cursor()
        
        # Check if column already exists
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='profiles' AND column_name='custom_fields'
        """)
        
        if cursor.fetchone():
            print("✅ Column 'custom_fields' already exists in profiles table")
        else:
            # Add the column
            cursor.execute("ALTER TABLE profiles ADD COLUMN custom_fields JSON;")
            conn.commit()
            print("✅ Successfully added 'custom_fields' column to profiles table")
        
        # Verify the column was added
        cursor.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name='profiles' AND column_name='custom_fields'
        """)
        
        result = cursor.fetchone()
        if result:
            print(f"✅ Verified: Column '{result[0]}' with type '{result[1]}' exists")
        else:
            print("❌ Column verification failed")
            
        cursor.close()
        conn.close()
        
    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("🔧 Adding custom_fields column to profiles table...")
    add_custom_fields_column()
    print("✅ Database schema update complete!")
