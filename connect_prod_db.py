#!/usr/bin/env python3
"""
Production Database Migration Script
This script connects to your production RDS database and runs the migration
"""

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Production database connection details
DB_HOST = "neo-networker-db-v2.c0d2k4qwgenr.us-east-1.rds.amazonaws.com"
DB_PORT = 5432
DB_NAME = "postgres"
DB_USER = "postgres"
# You'll need to provide the password

def run_migration():
    """Run the database migration to add missing columns"""
    
    print("🔧 Production Database Migration")
    print("=" * 50)
    print(f"Host: {DB_HOST}")
    print(f"Port: {DB_PORT}")
    print(f"Database: {DB_NAME}")
    print(f"User: {DB_USER}")
    print("=" * 50)
    
    # Get password from user
    password = input("Enter your database password: ")
    
    try:
        print("🔌 Connecting to production database...")
        
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=password,
            sslmode='require'
        )
        
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        print("✅ Connected to production database")
        
        # Migration SQL
        migration_sql = """
        -- Add all missing columns
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
        ALTER TABLE events ADD COLUMN IF NOT EXISTS google_event_id VARCHAR(255);
        ALTER TABLE events ADD COLUMN IF NOT EXISTS google_sync BOOLEAN DEFAULT TRUE;
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_scopes TEXT;

        -- Add indexes for performance
        CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);
        CREATE INDEX IF NOT EXISTS idx_events_google_event_id ON events(google_event_id);

        -- Update existing Google users with current scopes
        UPDATE profiles 
        SET google_scopes = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/contacts.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid'
        WHERE google_access_token IS NOT NULL AND google_scopes IS NULL;
        """
        
        print("🔧 Running migration...")
        cursor.execute(migration_sql)
        print("✅ Migration completed successfully!")
        
        # Verify the changes
        print("\n📋 Verifying changes...")
        cursor.execute("""
            SELECT 
                table_name, 
                column_name, 
                data_type, 
                is_nullable, 
                column_default
            FROM information_schema.columns 
            WHERE table_name IN ('profiles', 'events') 
                AND column_name IN ('stripe_customer_id', 'google_event_id', 'google_sync', 'google_scopes')
            ORDER BY table_name, column_name;
        """)
        
        results = cursor.fetchall()
        print("\n✅ Added columns:")
        for row in results:
            print(f"  - {row[0]}.{row[1]} ({row[2]})")
        
        cursor.close()
        conn.close()
        
        print("\n🎉 Migration completed successfully!")
        print("✅ Your production database is now updated")
        print("✅ Google OAuth login should work now")
        print("✅ Stripe subscription features are ready")
        
    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    run_migration()
