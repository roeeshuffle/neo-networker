#!/usr/bin/env python3
"""
Backend API endpoint to fix database schema
"""
import requests
import json

def fix_database_schema():
    """Call backend API to fix database schema"""
    
    # Backend URL
    api_url = "https://dkdrn34xpx.us-east-1.awsapprunner.com"
    
    # Login to get token
    login_data = {
        "email": "roee2912@gmail.com",
        "password": "123456"
    }
    
    try:
        # Try to login first
        print("🔐 Attempting to login...")
        login_response = requests.post(f"{api_url}/api/auth/login", json=login_data)
        
        if login_response.status_code == 200:
            token = login_response.json().get('access_token')
            print("✅ Login successful")
            
            # Call database fix endpoint
            headers = {'Authorization': f'Bearer {token}'}
            
            print("🔧 Attempting to fix database schema...")
            fix_response = requests.post(f"{api_url}/api/admin/fix-schema", headers=headers)
            
            if fix_response.status_code == 200:
                print("✅ Database schema fixed successfully")
                print(f"Response: {fix_response.json()}")
            else:
                print(f"❌ Schema fix failed: {fix_response.status_code}")
                print(f"Response: {fix_response.text}")
        else:
            print(f"❌ Login failed: {login_response.status_code}")
            print(f"Response: {login_response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    fix_database_schema()
