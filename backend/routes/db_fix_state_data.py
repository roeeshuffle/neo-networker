"""
Database fix endpoint for adding state_data column
"""

from flask import Blueprint, jsonify
import os
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

db_fix_bp = Blueprint('db_fix_state_data', __name__)

@db_fix_bp.route('/api/db-fix-state-data', methods=['POST'])
def fix_state_data_column():
    """Add state_data column to profiles table"""
    
    try:
        # Get database URL from environment
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            return jsonify({'error': 'DATABASE_URL not configured'}), 500
        
        # Connect to database
        conn = psycopg2.connect(database_url)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Check if column already exists
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'profiles' 
            AND column_name = 'state_data'
        """)
        
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'message': 'state_data column already exists', 'status': 'success'})
        
        # Add the column
        cursor.execute("""
            ALTER TABLE profiles 
            ADD COLUMN state_data JSON
        """)
        
        # Verify the column was added
        cursor.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'profiles' 
            AND column_name = 'state_data'
        """)
        
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if result:
            return jsonify({
                'message': f'Successfully added state_data column (type: {result[1]})',
                'status': 'success'
            })
        else:
            return jsonify({'error': 'Column verification failed'}), 500
            
    except Exception as e:
        return jsonify({'error': f'Database error: {str(e)}'}), 500
