#!/usr/bin/env python3
"""
Trigger the safe migration endpoint to fix database schema
"""

import requests
import json

def trigger_safe_migration():
    """Trigger the safe migration endpoint"""
    base_url = "https://dkdrn34xpx.us-east-1.awsapprunner.com/api"
    
    print("🔧 Triggering Safe Migration...")
    print("=" * 40)
    
    try:
        # Try POST to safe-migration endpoint
        response = requests.post(f"{base_url}/safe-migration", timeout=30)
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Migration triggered successfully!")
            try:
                data = response.json()
                print(f"Response: {json.dumps(data, indent=2)}")
            except:
                print(f"Response: {response.text}")
        elif response.status_code == 404:
            print("❌ Safe migration endpoint not found")
            print("The endpoint might not be deployed yet")
        elif response.status_code == 401:
            print("❌ Authentication required")
            print("The endpoint requires authentication")
        elif response.status_code == 500:
            print("❌ Server error during migration")
            try:
                error_data = response.json()
                print(f"Error: {error_data}")
            except:
                print(f"Raw error: {response.text[:200]}")
        else:
            print(f"⚠️  Unexpected status: {response.status_code}")
            print(f"Response: {response.text[:200]}")
            
    except Exception as e:
        print(f"❌ Exception: {str(e)}")

def trigger_quick_fix():
    """Trigger the quick fix endpoint"""
    base_url = "https://dkdrn34xpx.us-east-1.awsapprunner.com/api"
    
    print("\n🔧 Triggering Quick Fix...")
    print("=" * 40)
    
    try:
        # Try POST to quick-fix endpoint
        response = requests.post(f"{base_url}/quick-fix", timeout=30)
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Quick fix triggered successfully!")
            try:
                data = response.json()
                print(f"Response: {json.dumps(data, indent=2)}")
            except:
                print(f"Response: {response.text}")
        elif response.status_code == 404:
            print("❌ Quick fix endpoint not found")
            print("The endpoint might not be deployed yet")
        elif response.status_code == 401:
            print("❌ Authentication required")
            print("The endpoint requires authentication")
        elif response.status_code == 500:
            print("❌ Server error during fix")
            try:
                error_data = response.json()
                print(f"Error: {error_data}")
            except:
                print(f"Raw error: {response.text[:200]}")
        else:
            print(f"⚠️  Unexpected status: {response.status_code}")
            print(f"Response: {response.text[:200]}")
            
    except Exception as e:
        print(f"❌ Exception: {str(e)}")

if __name__ == "__main__":
    trigger_safe_migration()
    trigger_quick_fix()
    
    print("\n" + "=" * 40)
    print("📋 NEXT STEPS")
    print("=" * 40)
    print("1. If migration was successful, test the APIs again")
    print("2. If endpoints returned 404, the new code isn't deployed yet")
    print("3. If endpoints returned 401, they need authentication")
    print("4. Run: python test_now.py to verify the fix")
