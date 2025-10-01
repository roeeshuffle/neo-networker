#!/usr/bin/env python3
"""
Quick schema fix endpoint - standalone
"""
from flask import Blueprint, jsonify
import os
import psycopg2
from urllib.parse import urlparse

quick_fix_bp = Blueprint('quick_fix', __name__)

@quick_fix_bp.route('/quick-fix', methods=['POST'])
def quick_fix():
    """Quick database schema fix"""
    try:
        print("🔧 Starting quick database schema fix...")
        
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
        
        # Add missing columns to tasks table
        print("➕ Adding missing columns to tasks table...")
        
        # Check and add title column
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name = 'tasks' AND column_name = 'title'
            );
        """)
        
        if not cursor.fetchone()[0]:
            print("Adding title column...")
            cursor.execute("ALTER TABLE tasks ADD COLUMN title VARCHAR(255)")
            cursor.execute("UPDATE tasks SET title = COALESCE(text, 'Untitled Task') WHERE title IS NULL")
            cursor.execute("ALTER TABLE tasks ALTER COLUMN title SET NOT NULL")
        
        # Check and add project column
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name = 'tasks' AND column_name = 'project'
            );
        """)
        
        if not cursor.fetchone()[0]:
            print("Adding project column...")
            cursor.execute("ALTER TABLE tasks ADD COLUMN project VARCHAR(100)")
            cursor.execute("UPDATE tasks SET project = 'personal' WHERE project IS NULL")
            cursor.execute("ALTER TABLE tasks ALTER COLUMN project SET NOT NULL")
        
        # Check and add description column
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name = 'tasks' AND column_name = 'description'
            );
        """)
        
        if not cursor.fetchone()[0]:
            print("Adding description column...")
            cursor.execute("ALTER TABLE tasks ADD COLUMN description TEXT")
        
        # Check and add other columns
        for column, definition in [
            ('scheduled_date', 'TIMESTAMP'),
            ('is_scheduled', 'BOOLEAN DEFAULT FALSE'),
            ('is_active', 'BOOLEAN DEFAULT TRUE')
        ]:
            cursor.execute(f"""
                SELECT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_name = 'tasks' AND column_name = '{column}'
                );
            """)
            
            if not cursor.fetchone()[0]:
                print(f"Adding {column} column...")
                cursor.execute(f"ALTER TABLE tasks ADD COLUMN {column} {definition}")
        
        # Check if events table exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'events'
            );
        """)
        
        if not cursor.fetchone()[0]:
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
        
        # Commit changes
        conn.commit()
        cursor.close()
        conn.close()
        
        print("✅ Database schema fixed successfully!")
        
        return jsonify({
            'message': 'Database schema fixed successfully',
            'status': 'success'
        })
        
    except Exception as e:
        print(f"❌ Error fixing schema: {str(e)}")
        return jsonify({'error': str(e)}), 500
