#!/usr/bin/env python3
"""
Script to initialize the database by running modified Supabase migrations.
This script reads all .sql files from the migrations directory and executes them in order,
with modifications to work with standard PostgreSQL (without Supabase auth schema).
"""

import os
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from dotenv import load_dotenv
import glob
import re

# Load environment variables
load_dotenv()

def get_database_url():
    """Get database URL from environment"""
    return os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/neo_networker')

def modify_sql_for_standard_postgres(sql_content):
    """Modify SQL content to work with standard PostgreSQL instead of Supabase"""
    # Remove auth schema references and replace with public schema
    sql_content = re.sub(r'auth\.users', 'profiles', sql_content)
    sql_content = re.sub(r'auth\.uid\(\)', 'current_user_id()', sql_content)
    sql_content = re.sub(r'auth\.role\(\)', "'authenticated'", sql_content)
    
    # Remove auth schema creation
    sql_content = re.sub(r'CREATE SCHEMA IF NOT EXISTS auth;', '', sql_content)
    
    # Remove auth-specific functions and replace with simplified versions
    sql_content = re.sub(r'CREATE OR REPLACE FUNCTION auth\.uid\(\)[^;]*;', '', sql_content)
    sql_content = re.sub(r'CREATE OR REPLACE FUNCTION auth\.role\(\)[^;]*;', '', sql_content)
    
    # Remove RLS policies that reference auth schema
    sql_content = re.sub(r'CREATE POLICY[^;]*auth\.[^;]*;', '', sql_content)
    
    # Remove triggers that reference auth schema
    sql_content = re.sub(r'CREATE TRIGGER[^;]*auth\.[^;]*;', '', sql_content)
    
    # Remove functions that reference auth schema
    sql_content = re.sub(r'CREATE OR REPLACE FUNCTION[^;]*auth\.[^;]*;', '', sql_content)
    
    # Remove auth schema references from policies
    sql_content = re.sub(r'USING \(auth\.[^)]*\)', 'USING (true)', sql_content)
    sql_content = re.sub(r'WITH CHECK \(auth\.[^)]*\)', 'WITH CHECK (true)', sql_content)
    
    # Remove auth schema references from function calls
    sql_content = re.sub(r'auth\.[a-zA-Z_]+\(\)', 'true', sql_content)
    
    return sql_content

def run_sql_file(cursor, file_path):
    """Run a single SQL file with modifications"""
    print(f"Running {file_path}...")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        # Modify SQL for standard PostgreSQL
        modified_sql = modify_sql_for_standard_postgres(sql_content)
        
        # Split by semicolon and execute each statement
        statements = [stmt.strip() for stmt in modified_sql.split(';') if stmt.strip()]
        
        for statement in statements:
            if statement and not statement.startswith('--'):
                try:
                    cursor.execute(statement)
                except Exception as e:
                    # Skip statements that fail (like auth schema references)
                    if 'auth' in str(e).lower() or 'schema' in str(e).lower():
                        print(f"  Skipping statement due to auth schema: {e}")
                        continue
                    else:
                        raise
        
        print(f"✓ Successfully executed {file_path}")
        
    except Exception as e:
        print(f"✗ Error executing {file_path}: {e}")
        # Continue with other files even if one fails
        return False

def main():
    """Main function to run all migrations"""
    # Get migrations directory path
    migrations_dir = os.path.join(os.path.dirname(__file__), '..', 'supabase', 'migrations')
    
    if not os.path.exists(migrations_dir):
        print(f"Error: Migrations directory not found at {migrations_dir}")
        sys.exit(1)
    
    # Get all SQL files and sort them by filename (which includes timestamp)
    sql_files = glob.glob(os.path.join(migrations_dir, '*.sql'))
    sql_files.sort()
    
    if not sql_files:
        print("No SQL migration files found")
        sys.exit(1)
    
    print(f"Found {len(sql_files)} migration files")
    
    # Connect to database
    try:
        conn = psycopg2.connect(get_database_url())
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        print("Connected to database successfully")
        
        # Create a simple current_user_id function
        cursor.execute("""
            CREATE OR REPLACE FUNCTION current_user_id()
            RETURNS TEXT AS $$
            BEGIN
                RETURN 'default-user-id';
            END;
            $$ LANGUAGE plpgsql;
        """)
        
        # Run each migration file
        success_count = 0
        for sql_file in sql_files:
            if run_sql_file(cursor, sql_file):
                success_count += 1
        
        print(f"\n✓ {success_count}/{len(sql_files)} migrations completed successfully!")
        
    except Exception as e:
        print(f"✗ Database error: {e}")
        sys.exit(1)
    
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

if __name__ == '__main__':
    main()
