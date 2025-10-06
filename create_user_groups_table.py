#!/usr/bin/env python3
"""
User Groups Table Creation Script
Run this script to create the user_groups table in your database
"""

import os
import sys

def create_user_groups_table():
    """Create the user_groups table"""
    
    # Database connection string - update with your actual credentials
    DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:YOUR_PASSWORD@YOUR_RDS_ENDPOINT:5432/neo_networker?sslmode=require')
    
    try:
        print("🔧 Creating user_groups table...")
        print("📝 Make sure to update the DATABASE_URL with your actual credentials")
        
        # Import required modules
        try:
            from sqlalchemy import create_engine, text
        except ImportError:
            print("❌ SQLAlchemy not installed. Install with: pip install sqlalchemy psycopg2-binary")
            return False
        
        # Create engine
        engine = create_engine(DATABASE_URL)
        
        with engine.connect() as conn:
            # Create user_groups table
            create_table_sql = """
            CREATE TABLE IF NOT EXISTS user_groups (
                id SERIAL PRIMARY KEY,
                owner_id VARCHAR(36) NOT NULL REFERENCES profiles(id),
                member_email VARCHAR(255) NOT NULL,
                member_name VARCHAR(255),
                added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT unique_owner_member UNIQUE (owner_id, member_email)
            );
            """
            
            conn.execute(text(create_table_sql))
            conn.commit()
            print("✅ user_groups table created successfully!")
            
            # Create indexes
            index_sql = """
            CREATE INDEX IF NOT EXISTS idx_user_groups_owner_id ON user_groups(owner_id);
            CREATE INDEX IF NOT EXISTS idx_user_groups_member_email ON user_groups(member_email);
            """
            
            conn.execute(text(index_sql))
            conn.commit()
            print("✅ Indexes created successfully!")
            
            # Verify table exists
            verify_sql = "SELECT COUNT(*) FROM user_groups;"
            result = conn.execute(text(verify_sql))
            count = result.scalar()
            print(f"✅ Table verified - {count} records in user_groups table")
            
            return True
            
    except Exception as e:
        print(f"❌ Error creating user_groups table: {e}")
        print("\n🔧 Troubleshooting:")
        print("1. Make sure DATABASE_URL is correct")
        print("2. Ensure you have network access to the database")
        print("3. Check that the profiles table exists")
        print("4. Verify your database credentials")
        return False

if __name__ == "__main__":
    print("🚀 User Groups Table Creation Script")
    print("=" * 50)
    
    success = create_user_groups_table()
    
    if success:
        print("\n🎉 SUCCESS! Group management feature is now enabled!")
        print("You can now add users to your group in the Settings tab.")
    else:
        print("\n❌ FAILED! Please check the error messages above.")
        print("You can also run the SQL script manually: CREATE_USER_GROUPS_TABLE.sql")
