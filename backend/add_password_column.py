#!/usr/bin/env python3
"""
Script to add password_hash column to production database
"""
import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def add_password_column():
    """Add password_hash column to profiles table"""
    try:
        # Get database URL from environment
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            print("❌ DATABASE_URL not found in environment variables")
            return False
        
        print(f"🔗 Connecting to database...")
        
        # Connect to database
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        # Check if column already exists
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'profiles' AND column_name = 'password_hash'
        """)
        
        if cursor.fetchone():
            print("✅ password_hash column already exists")
            return True
        
        # Add the column
        print("➕ Adding password_hash column...")
        cursor.execute("ALTER TABLE profiles ADD COLUMN password_hash VARCHAR(255)")
        
        # Commit the changes
        conn.commit()
        print("✅ password_hash column added successfully")
        
        # Close connection
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Error adding password_hash column: {e}")
        return False

if __name__ == "__main__":
    add_password_column()
