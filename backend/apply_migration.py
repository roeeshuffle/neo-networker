#!/usr/bin/env python3
"""
Script to apply the Google OAuth database migration to production
"""
import os
import sys
from alembic import command
from alembic.config import Config

def apply_migration():
    """Apply the Google OAuth migration"""
    try:
        # Check if we're in production
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            print("❌ DATABASE_URL not found. Make sure you're running this in production.")
            return False
            
        print(f"🔍 Database URL: {database_url[:20]}...")
        
        # Configure Alembic
        alembic_cfg = Config('alembic.ini')
        
        # Check current revision
        print("📋 Checking current database revision...")
        command.current(alembic_cfg)
        
        # Apply the migration
        print("🚀 Applying Google OAuth migration...")
        command.upgrade(alembic_cfg, 'head')
        
        print("✅ Migration applied successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error applying migration: {e}")
        return False

if __name__ == "__main__":
    success = apply_migration()
    sys.exit(0 if success else 1)
