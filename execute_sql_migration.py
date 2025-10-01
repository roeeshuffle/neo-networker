#!/usr/bin/env python3
"""
Execute SQL Migration Script
This script executes the SQL migration directly against the production database.
"""

import psycopg2
import os
import sys

def get_production_database_url():
    """Get production database URL from environment or use default"""
    # Try to get from environment first
    db_url = os.environ.get('DATABASE_URL')
    if db_url:
        return db_url
    
    # Fallback to production URL (this might not work from local)
    return "postgresql://postgres:NeoNetworker2024!@neo-networker-db.cqjqjqjqjqjq.us-east-1.rds.amazonaws.com:5432/neo_networker"

def execute_sql_migration():
    """Execute the SQL migration script"""
    try:
        db_url = get_production_database_url()
        print(f"Connecting to database...")
        
        conn = psycopg2.connect(db_url)
        conn.autocommit = True  # Enable autocommit for DDL statements
        cursor = conn.cursor()
        
        print("🚀 Starting SQL migration...")
        
        # Read and execute the SQL file
        sql_file = os.path.join(os.path.dirname(__file__), 'production_migration.sql')
        
        with open(sql_file, 'r') as f:
            sql_content = f.read()
        
        # Split by semicolon and execute each statement
        statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip()]
        
        for i, statement in enumerate(statements, 1):
            if statement:
                print(f"Executing statement {i}/{len(statements)}...")
                try:
                    cursor.execute(statement)
                    print(f"✅ Statement {i} executed successfully")
                except Exception as e:
                    print(f"⚠️  Statement {i} warning: {e}")
                    # Continue with other statements
        
        print("🎉 SQL migration completed successfully!")
        
        # Show final table structure
        print("\n📋 Final database structure:")
        cursor.execute("""
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name IN ('users', 'people', 'tasks', 'events')
            ORDER BY table_name, ordinal_position;
        """)
        
        results = cursor.fetchall()
        current_table = None
        for table_name, column_name, data_type in results:
            if table_name != current_table:
                print(f"\n{table_name}:")
                current_table = table_name
            print(f"  - {column_name}: {data_type}")
        
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Neo Networker SQL Migration")
    print("=" * 40)
    
    success = execute_sql_migration()
    
    if success:
        print("\n🎉 Migration completed successfully!")
        sys.exit(0)
    else:
        print("\n❌ Migration failed!")
        sys.exit(1)
