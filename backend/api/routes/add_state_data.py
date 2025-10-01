from flask import Blueprint, jsonify
import subprocess
import os

add_state_data_bp = Blueprint('add_state_data', __name__)

@add_state_data_bp.route('/add-state-data', methods=['POST'])
def add_state_data():
    """Add state_data column to profiles table"""
    try:
        # Set environment variable for the script
        env = os.environ.copy()
        env['DATABASE_URL'] = os.getenv('DATABASE_URL')
        
        # Run the simple script
        result = subprocess.run([
            'python3', 'add_state_data_simple.py'
        ], capture_output=True, text=True, cwd='.', env=env)
        
        return jsonify({
            'success': result.returncode == 0,
            'output': result.stdout,
            'error': result.stderr
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
