#!/usr/bin/env python3
"""
Endpoint to apply the Google OAuth database migration
"""
from flask import Blueprint, jsonify
from alembic import command
from alembic.config import Config
import logging

migration_bp = Blueprint('migration', __name__)
logger = logging.getLogger(__name__)

@migration_bp.route('/apply-migration', methods=['POST'])
def apply_migration():
    """Apply the Google OAuth migration"""
    try:
        # Configure Alembic
        alembic_cfg = Config('alembic.ini')
        
        # Check current revision
        logger.info("📋 Checking current database revision...")
        command.current(alembic_cfg)
        
        # Apply the migration
        logger.info("🚀 Applying Google OAuth migration...")
        command.upgrade(alembic_cfg, 'head')
        
        logger.info("✅ Migration applied successfully!")
        return jsonify({'status': 'success', 'message': 'Migration applied successfully'})
        
    except Exception as e:
        logger.error(f"❌ Error applying migration: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500
