#!/usr/bin/env python3
"""
Force create events table and fix any remaining issues
"""

import requests
import json
import time

# Configuration
BASE_URL = "https://dkdrn34xpx.us-east-1.awsapprunner.com/api"
QUICK_FIX_URL = f"{BASE_URL}/quick-fix"

def force_events_table_fix():
    print("🔧 FORCING EVENTS TABLE FIX")
    print("==========================")
    
    # Run quick fix multiple times to ensure events table is created
    for attempt in range(5):
        print(f"\n📡 Attempt {attempt + 1}/5: Running quick fix...")
        try:
            response = requests.post(QUICK_FIX_URL, timeout=30)
            
            if response.status_code == 200:
                print("✅ Quick fix successful!")
                result = response.json()
                print(f"Response: {json.dumps(result, indent=2)}")
            else:
                print(f"❌ Quick fix failed: {response.status_code}")
                print(f"Error: {response.text}")
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Error: {e}")
        
        # Wait between attempts
        if attempt < 4:
            print("⏳ Waiting 3 seconds before next attempt...")
            time.sleep(3)
    
    # Test the APIs after the fix
    print("\n🧪 Testing APIs after fix...")
    test_endpoints = [
        ("Tasks GET", f"{BASE_URL}/tasks"),
        ("Events GET", f"{BASE_URL}/events"),
    ]
    
    for name, url in test_endpoints:
        try:
            response = requests.get(url, timeout=10)
            if response.status_code == 401:
                print(f"   ✅ {name}: Auth required (expected)")
            elif response.status_code == 500:
                print(f"   ❌ {name}: Server error (still broken)")
            else:
                print(f"   ⚠️  {name}: {response.status_code}")
        except Exception as e:
            print(f"   ❌ {name} error: {e}")
    
    print("\n==========================")
    print("📊 SUMMARY")
    print("==========================")
    print("✅ If you see 'Auth required' for all endpoints, the schema is fixed")
    print("❌ If you see 'Server error' for any endpoint, there are still issues")
    print("🔧 The events table should now be properly created")

if __name__ == "__main__":
    force_events_table_fix()
