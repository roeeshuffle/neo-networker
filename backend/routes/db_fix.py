from flask import Blueprint, jsonify
import subprocess
import sys
import os

db_fix_bp = Blueprint('db_fix', __name__)

@db_fix_bp.route('/db-fix', methods=['POST'])
def run_db_fix():
    """Run database fix to add WhatsApp columns"""
    try:
        # Get the path to the fix script
        script_path = os.path.join(os.path.dirname(__file__), '..', 'run_db_fix.py')
        
        # Run the database fix script
        result = subprocess.run([sys.executable, script_path], 
                              capture_output=True, 
                              text=True, 
                              cwd=os.path.dirname(script_path))
        
        if result.returncode == 0:
            return jsonify({
                'success': True,
                'message': 'Database fix completed successfully',
                'output': result.stdout
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Database fix failed',
                'error': result.stderr,
                'output': result.stdout
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error running database fix: {str(e)}'
        }), 500
