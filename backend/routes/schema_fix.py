from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User
import os
import psycopg2
from urllib.parse import urlparse

schema_fix_bp = Blueprint('schema_fix', __name__)

@schema_fix_bp.route('/fix-schema', methods=['POST'])
def fix_schema():
    """Fix the database schema by adding missing columns"""
    try:
        print("🔧 Starting database schema fix...")
        
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
        
        # Check if title column exists in tasks table
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name = 'tasks' AND column_name = 'title'
            );
        """)
        
        title_exists = cursor.fetchone()[0]
        
        if not title_exists:
            print("➕ Adding title column to tasks table...")
            cursor.execute("ALTER TABLE tasks ADD COLUMN title VARCHAR(255)")
            
            # Update existing tasks with default title
            cursor.execute("UPDATE tasks SET title = COALESCE(text, 'Untitled Task') WHERE title IS NULL")
            
            # Make title NOT NULL
            cursor.execute("ALTER TABLE tasks ALTER COLUMN title SET NOT NULL")
        
        # Check if project column exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name = 'tasks' AND column_name = 'project'
            );
        """)
        
        project_exists = cursor.fetchone()[0]
        
        if not project_exists:
            print("➕ Adding project column to tasks table...")
            cursor.execute("ALTER TABLE tasks ADD COLUMN project VARCHAR(100)")
            
            # Update existing tasks with default project
            cursor.execute("UPDATE tasks SET project = 'personal' WHERE project IS NULL")
            
            # Make project NOT NULL
            cursor.execute("ALTER TABLE tasks ALTER COLUMN project SET NOT NULL")
        
        # Check if description column exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name = 'tasks' AND column_name = 'description'
            );
        """)
        
        description_exists = cursor.fetchone()[0]
        
        if not description_exists:
            print("➕ Adding description column to tasks table...")
            cursor.execute("ALTER TABLE tasks ADD COLUMN description TEXT")
        
        # Check if scheduled_date column exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name = 'tasks' AND column_name = 'scheduled_date'
            );
        """)
        
        scheduled_date_exists = cursor.fetchone()[0]
        
        if not scheduled_date_exists:
            print("➕ Adding scheduled_date column to tasks table...")
            cursor.execute("ALTER TABLE tasks ADD COLUMN scheduled_date TIMESTAMP")
        
        # Check if is_scheduled column exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name = 'tasks' AND column_name = 'is_scheduled'
            );
        """)
        
        is_scheduled_exists = cursor.fetchone()[0]
        
        if not is_scheduled_exists:
            print("➕ Adding is_scheduled column to tasks table...")
            cursor.execute("ALTER TABLE tasks ADD COLUMN is_scheduled BOOLEAN DEFAULT FALSE")
        
        # Check if is_active column exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name = 'tasks' AND column_name = 'is_active'
            );
        """)
        
        is_active_exists = cursor.fetchone()[0]
        
        if not is_active_exists:
            print("➕ Adding is_active column to tasks table...")
            cursor.execute("ALTER TABLE tasks ADD COLUMN is_active BOOLEAN DEFAULT TRUE")
        
        # Check if events table exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'events'
            );
        """)
        
        events_exists = cursor.fetchone()[0]
        
        if not events_exists:
            print("➕ Creating events table...")
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
            
            # Create index
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
