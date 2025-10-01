#!/usr/bin/env python3
"""
Comprehensive database fix to ensure all required columns exist
"""

from flask import Blueprint, jsonify
from backend.dal.database import db
import sqlalchemy as sa
from sqlalchemy import text

comprehensive_fix_bp = Blueprint('comprehensive_fix', __name__)

@comprehensive_fix_bp.route('/comprehensive-fix', methods=['POST'])
def comprehensive_db_fix():
    """Comprehensive database schema fix"""
    try:
        connection = db.engine.connect()
        
        # Fix tasks table
        print("🔧 Fixing tasks table...")
        
        # Add missing columns to tasks table
        tasks_columns = [
            ('title', 'VARCHAR(255)', 'COALESCE(text, \'Untitled Task\')'),
            ('description', 'TEXT', 'NULL'),
            ('project', 'VARCHAR(100)', '\'personal\''),
            ('scheduled_date', 'TIMESTAMP', 'NULL'),
            ('is_scheduled', 'BOOLEAN', 'FALSE'),
            ('is_active', 'BOOLEAN', 'TRUE')
        ]
        
        for column_name, column_type, default_value in tasks_columns:
            # Check if column exists
            result = connection.execute(text(f"""
                SELECT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_name = 'tasks' AND column_name = '{column_name}'
                );
            """))
            
            column_exists = result.fetchone()[0]
            
            if not column_exists:
                print(f"Adding column {column_name} to tasks table...")
                
                # Add column as nullable first
                if default_value == 'NULL':
                    connection.execute(text(f"ALTER TABLE tasks ADD COLUMN {column_name} {column_type}"))
                else:
                    connection.execute(text(f"ALTER TABLE tasks ADD COLUMN {column_name} {column_type}"))
                    # Set default values for existing rows
                    connection.execute(text(f"UPDATE tasks SET {column_name} = {default_value} WHERE {column_name} IS NULL"))
                    
                    # Make NOT NULL for required columns
                    if column_name in ['title', 'project']:
                        connection.execute(text(f"ALTER TABLE tasks ALTER COLUMN {column_name} SET NOT NULL"))
        
        # Fix events table
        print("🔧 Fixing events table...")
        
        # Check if events table exists
        result = connection.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'events'
            );
        """))
        
        events_table_exists = result.fetchone()[0]
        
        if not events_table_exists:
            print("Creating events table...")
            connection.execute(text("""
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
            """))
            connection.execute(text("CREATE INDEX ix_events_id ON events (id);"))
        
        # Check if event_type column exists in events table
        result = connection.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name = 'events' AND column_name = 'event_type'
            );
        """))
        
        event_type_exists = result.fetchone()[0]
        
        if not event_type_exists:
            print("Adding event_type column to events table...")
            connection.execute(text("ALTER TABLE events ADD COLUMN event_type VARCHAR(50) DEFAULT 'event'"))
        
        connection.commit()
        connection.close()
        
        return jsonify({
            "message": "Comprehensive database schema fix completed successfully",
            "status": "success"
        })
        
    except Exception as e:
        return jsonify({
            "error": f"Database fix failed: {str(e)}",
            "status": "error"
        }), 500
