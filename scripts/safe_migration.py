#!/usr/bin/env python3
"""
Safe migration endpoint - applies the safe migration directly
"""
from flask import Blueprint, jsonify
import os
import psycopg2
from urllib.parse import urlparse

safe_migration_bp = Blueprint('safe_migration', __name__)

@safe_migration_bp.route('/safe-migration', methods=['POST'])
def safe_migration():
    """Apply safe migration that handles existing columns"""
    try:
        print("🔧 Starting safe migration...")
        
        # Get database URL from environment
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            return jsonify({'error': 'DATABASE_URL not configured'}), 500
        
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
        
        print("✅ Safe migration completed successfully!")
        
        return jsonify({
            'message': 'Safe migration completed successfully',
            'status': 'success'
        })
        
    except Exception as e:
        print(f"❌ Error in safe migration: {str(e)}")
        return jsonify({'error': str(e)}), 500
