#!/usr/bin/env python3
"""
Migration script to create user_groups table
Run this script to add the user_groups table to the database
"""

import os
import sys
from sqlalchemy import create_engine, text

# Database connection
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:NeoNetworker2024!@neo-networker-db-v2.c0d2k4qwgenr.us-east-1.rds.amazonaws.com:5432/neo_networker?sslmode=require')

def create_user_groups_table():
    """Create the user_groups table"""
    try:
        print("🔧 Creating user_groups table...")
        
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
            
            # Create indexes for better performance
            index_sql = """
            CREATE INDEX IF NOT EXISTS idx_user_groups_owner_id ON user_groups(owner_id);
            CREATE INDEX IF NOT EXISTS idx_user_groups_member_email ON user_groups(member_email);
            """
            
            conn.execute(text(index_sql))
            conn.commit()
            
            print("✅ user_groups table created successfully!")
            print("✅ Indexes created successfully!")
            
            # Verify table exists
            verify_sql = "SELECT COUNT(*) FROM user_groups;"
            result = conn.execute(text(verify_sql))
            count = result.scalar()
            print(f"✅ Table verified - {count} records in user_groups table")
            
    except Exception as e:
        print(f"❌ Error creating user_groups table: {e}")
        sys.exit(1)

if __name__ == "__main__":
    create_user_groups_table()
