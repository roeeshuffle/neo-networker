#!/usr/bin/env python3
"""
Database Schema Fix Script
Run this script to fix the database schema issues
"""

import os
import psycopg2
from urllib.parse import urlparse

def fix_database():
    """Fix the database schema by adding missing columns"""
    try:
        print("🔧 Starting database schema fix...")
        
        # Get database URL from environment
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            print("❌ DATABASE_URL not configured")
            return False
        
        # Parse the database URL
        parsed = urlparse(database_url)
        
        # Connect to database
        conn = psycopg2.connect(
            host=parsed.hostname,
            port=parsed.port,
            database=parsed.path[1:],  # Remove leading slash
            user=parsed.username,
            password=parsed.password
        )
        
        cursor = conn.cursor()
        
        print("➕ Adding missing columns to tasks table...")
        
        # Check and add missing columns to tasks table
        columns_to_add = [
            ('title', 'VARCHAR(255)', 'COALESCE(text, \'Untitled Task\')'),
            ('description', 'TEXT', 'NULL'),
            ('project', 'VARCHAR(100)', '\'personal\''),
            ('scheduled_date', 'TIMESTAMP', 'NULL'),
            ('is_scheduled', 'BOOLEAN', 'FALSE'),
            ('is_active', 'BOOLEAN', 'TRUE')
        ]
        
        for column_name, column_type, default_value in columns_to_add:
            # Check if column exists
            cursor.execute(f"""
                SELECT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_name = 'tasks' AND column_name = '{column_name}'
                );
            """)
            
            column_exists = cursor.fetchone()[0]
            
            if not column_exists:
                print(f"Adding column {column_name} to tasks table...")
                
                # Add column as nullable first
                if default_value == 'NULL':
                    cursor.execute(f"ALTER TABLE tasks ADD COLUMN {column_name} {column_type}")
                else:
                    cursor.execute(f"ALTER TABLE tasks ADD COLUMN {column_name} {column_type}")
                    # Set default values for existing rows
                    cursor.execute(f"UPDATE tasks SET {column_name} = {default_value} WHERE {column_name} IS NULL")
                    
                    # Make NOT NULL for required columns
                    if column_name in ['title', 'project']:
                        cursor.execute(f"ALTER TABLE tasks ALTER COLUMN {column_name} SET NOT NULL")
            else:
                print(f"Column {column_name} already exists, skipping...")
        
        # Check if events table exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'events'
            );
        """)
        
        events_table_exists = cursor.fetchone()[0]
        
        if not events_table_exists:
            print("Creating events table...")
            cursor.execute("""
                CREATE TABLE events (
                    id SERIAL PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    start_datetime TIMESTAMP NOT NULL,
                    end_datetime TIMESTAMP NOT NULL,
                    location VARCHAR(255),
                    event_type VARCHAR(50) DEFAULT 'event',
                    participants JSON,
                    alert_minutes INTEGER DEFAULT 15,
                    repeat_pattern VARCHAR(50),
                    repeat_interval INTEGER DEFAULT 1,
                    repeat_days JSON,
                    repeat_end_date TIMESTAMP,
                    notes TEXT,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    user_id VARCHAR(36) NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES profiles(id)
                );
            """)
            cursor.execute("CREATE INDEX ix_events_id ON events (id);")
        else:
            print("Events table already exists, checking for missing columns...")
            
            # Check if event_type column exists in events table
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_name = 'events' AND column_name = 'event_type'
                );
            """)
            
            event_type_exists = cursor.fetchone()[0]
            
            if not event_type_exists:
                print("Adding event_type column to events table...")
                cursor.execute("ALTER TABLE events ADD COLUMN event_type VARCHAR(50) DEFAULT 'event'")
            else:
                print("event_type column already exists, skipping...")
        
        # Update alembic version table to mark migration as complete
        cursor.execute("""
            INSERT INTO alembic_version (version_num) 
            VALUES ('e4b455227745') 
            ON CONFLICT (version_num) DO NOTHING;
        """)
        
        # Commit changes
        conn.commit()
        cursor.close()
        conn.close()
        
        print("✅ Database schema fixed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error fixing schema: {str(e)}")
        return False

if __name__ == "__main__":
    success = fix_database()
    if success:
        print("\n🎉 Database schema has been fixed!")
        print("You can now refresh your application and it should work properly.")
    else:
        print("\n❌ Failed to fix database schema.")
        print("Please check the error messages above and try again.")
