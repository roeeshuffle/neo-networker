#!/usr/bin/env python3
"""
Script to add custom_fields column using the backend's database connection
"""
import sys
import os

# Add the backend directory to Python path
sys.path.append('/Users/roeefeingold/neo-networker/backend')

try:
    from dal.database import db
    from dal.models.user import User
    from api.app import app
    
    def add_custom_fields_column():
        """Add custom_fields column to profiles table"""
        with app.app_context():
            try:
                # Execute raw SQL to add the column
                db.engine.execute("""
                    DO $$ 
                    BEGIN
                        IF NOT EXISTS (
                            SELECT 1 
                            FROM information_schema.columns 
                            WHERE table_name = 'profiles' 
                            AND column_name = 'custom_fields'
                        ) THEN
                            ALTER TABLE profiles ADD COLUMN custom_fields JSON;
                            RAISE NOTICE 'Column custom_fields added to profiles table';
                        ELSE
                            RAISE NOTICE 'Column custom_fields already exists in profiles table';
                        END IF;
                    END $$;
                """)
                print("✅ Successfully added custom_fields column to profiles table")
                
                # Test the User model
                user = User.query.first()
                if user:
                    print(f"✅ User model test successful - found user: {user.email}")
                else:
                    print("⚠️ No users found in database")
                    
            except Exception as e:
                print(f"❌ Error adding column: {e}")
                return False
                
        return True
    
    if __name__ == "__main__":
        print("🔧 Adding custom_fields column to profiles table...")
        if add_custom_fields_column():
            print("✅ Database schema update complete!")
        else:
            print("❌ Database schema update failed!")
            sys.exit(1)
            
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Make sure you're running this from the project root directory")
    sys.exit(1)
