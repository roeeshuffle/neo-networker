#!/usr/bin/env python3
"""
Script to initialize the database by running all existing Supabase migrations.
This script reads all .sql files from the migrations directory and executes them in order.
"""

import os
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from dotenv import load_dotenv
import glob

# Load environment variables
load_dotenv()

def get_database_url():
    """Get database URL from environment"""
    return os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/neo_networker')

def run_sql_file(cursor, file_path):
    """Run a single SQL file"""
    print(f"Running {file_path}...")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        # Split by semicolon and execute each statement
        statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip()]
        
        for statement in statements:
            if statement:
                cursor.execute(statement)
        
        print(f"✓ Successfully executed {file_path}")
        
    except Exception as e:
        print(f"✗ Error executing {file_path}: {e}")
        raise

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
        
        # Run each migration file
        for sql_file in sql_files:
            run_sql_file(cursor, sql_file)
        
        print("\n✓ All migrations completed successfully!")
        
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
