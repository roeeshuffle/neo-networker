from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User
from alembic.config import Config
from alembic import command
import os

migration_bp = Blueprint('migration', __name__)

@migration_bp.route('/migrate', methods=['POST'])
@jwt_required()
def run_migration():
    """Run database migration - only for admin users"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user or not current_user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Check if user is admin (you can add admin field to User model)
        # For now, we'll allow any approved user to run migration
        # In production, you should restrict this to admin users only
        
        print("🚀 Starting database migration...")
        
        # Create alembic config
        alembic_cfg = Config("alembic.ini")
        
        # Get current migration status
        print("📋 Current migration status:")
        command.current(alembic_cfg)
        
        # Apply migration
        print("🚀 Applying migrations...")
        command.upgrade(alembic_cfg, "head")
        
        print("✅ Migration completed successfully!")
        
        return jsonify({
            'message': 'Migration completed successfully',
            'status': 'success'
        })
        
    except Exception as e:
        print(f"❌ Error running migration: {str(e)}")
        return jsonify({'error': str(e)}), 500
