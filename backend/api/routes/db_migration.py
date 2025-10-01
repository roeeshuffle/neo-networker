from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from dal.models import User
from dal.database import db
import logging
import subprocess
import sys
import os

migration_bp = Blueprint('migration', __name__)
migration_logger = logging.getLogger(__name__)

def check_admin_access(user_id):
    """Check if user has admin access"""
    user = User.query.get(user_id)
    return user and user.is_approved and user.email == "admin@neo-networker.com"

def check_migration_bypass():
    """Check if migration can be run without authentication (one-time bypass)"""
    # This is a one-time bypass for the initial migration
    # In production, this should be removed after migration is complete
    return True  # Temporarily allow bypass for migration

@migration_bp.route('/migration-test', methods=['GET'])
def migration_test():
    """Test endpoint to verify migration route is working"""
    return jsonify({'message': 'Migration endpoint is working', 'status': 'ok'})

@migration_bp.route('/migrate-database', methods=['POST'])
def migrate_database():
    """Run database migration to update production database structure"""
    try:
        # One-time bypass for initial migration
        if not check_migration_bypass():
            return jsonify({'error': 'Migration bypass not allowed'}), 403
        
        migration_logger.info("🚀 Starting production database migration...")
        
        # Run the migration script
        script_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'migrate_production_db.py')
        
        try:
            result = subprocess.run([
                sys.executable, script_path
            ], capture_output=True, text=True, timeout=300)
            
            if result.returncode == 0:
                migration_logger.info("✅ Database migration completed successfully")
                return jsonify({
                    'message': 'Database migration completed successfully',
                    'output': result.stdout
                }), 200
            else:
                migration_logger.error(f"❌ Migration failed: {result.stderr}")
                return jsonify({
                    'error': 'Database migration failed',
                    'details': result.stderr
                }), 500
                
        except subprocess.TimeoutExpired:
            migration_logger.error("❌ Migration timed out")
            return jsonify({'error': 'Migration timed out'}), 500
        except Exception as e:
            migration_logger.error(f"❌ Migration error: {e}")
            return jsonify({'error': str(e)}), 500
        
    except Exception as e:
        migration_logger.error(f"💥 Error in migration endpoint: {e}")
        return jsonify({'error': str(e)}), 500
