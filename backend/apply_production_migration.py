#!/usr/bin/env python3
"""
Script to apply database migrations to production database
"""
import os
import sys
from alembic.config import Config
from alembic import command

def apply_migration():
    """Apply the latest migration to the production database"""
    try:
        # Check if DATABASE_URL is set
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            print("❌ DATABASE_URL not found in environment variables")
            print("Make sure you're running this with the production environment variables")
            return False
        
        print(f"🔗 Connecting to database: {database_url.split('@')[1] if '@' in database_url else 'unknown'}")
        
        # Create alembic config
        alembic_cfg = Config("alembic.ini")
        
        # Set the database URL
        alembic_cfg.set_main_option('sqlalchemy.url', database_url)
        
        print("📋 Current migration status:")
        command.current(alembic_cfg)
        
        print("\n🚀 Applying migrations to production database...")
        command.upgrade(alembic_cfg, "head")
        
        print("\n✅ Migration completed successfully!")
        print("📋 New migration status:")
        command.current(alembic_cfg)
        
        return True
        
    except Exception as e:
        print(f"❌ Error applying migration: {str(e)}")
        return False

if __name__ == "__main__":
    success = apply_migration()
    sys.exit(0 if success else 1)
