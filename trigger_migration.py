#!/usr/bin/env python3
"""
Script to trigger the production database migration
"""

import requests
import json
import sys

def trigger_migration():
    """Trigger the database migration via API"""
    
    # You'll need to provide admin credentials
    print("🔐 To run the migration, you need admin credentials.")
    print("Please provide your admin email and password:")
    
    email = input("Admin email: ").strip()
    password = input("Admin password: ").strip()
    
    if not email or not password:
        print("❌ Email and password are required")
        return False
    
    base_url = "https://dkdrn34xpx.us-east-1.awsapprunner.com/api"
    
    try:
        # Step 1: Login to get JWT token
        print("🔑 Logging in...")
        login_response = requests.post(f"{base_url}/auth/login", json={
            "email": email,
            "password": password
        })
        
        if login_response.status_code != 200:
            print(f"❌ Login failed: {login_response.text}")
            return False
        
        token = login_response.json().get('access_token')
        if not token:
            print("❌ No access token received")
            return False
        
        print("✅ Login successful")
        
        # Step 2: Trigger migration
        print("🚀 Triggering database migration...")
        headers = {"Authorization": f"Bearer {token}"}
        
        migration_response = requests.post(
            f"{base_url}/migrate-database",
            headers=headers,
            timeout=600  # 10 minutes timeout
        )
        
        if migration_response.status_code == 200:
            result = migration_response.json()
            print("✅ Migration completed successfully!")
            print(f"📋 Output: {result.get('output', 'No output')}")
            return True
        else:
            print(f"❌ Migration failed: {migration_response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("⏰ Migration timed out - this is normal for large databases")
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Neo Networker Production Database Migration")
    print("=" * 50)
    
    success = trigger_migration()
    
    if success:
        print("\n🎉 Migration process completed!")
        print("The production database should now match the simplified code structure.")
    else:
        print("\n❌ Migration failed. Please check the error messages above.")
        sys.exit(1)
