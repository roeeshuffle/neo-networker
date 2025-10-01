#!/usr/bin/env python3
"""
Test APIs after database fix
"""

import requests
import json
import time

# Configuration
BASE_URL = "https://dkdrn34xpx.us-east-1.awsapprunner.com/api"
HEALTH_URL = f"{BASE_URL}/health"
TASKS_URL = f"{BASE_URL}/tasks"
EVENTS_URL = f"{BASE_URL}/events"

def test_apis_after_fix():
    print("🧪 TESTING APIS AFTER DATABASE FIX")
    print("==================================")
    
    # Test health endpoint
    print("1. Testing health endpoint...")
    try:
        response = requests.get(HEALTH_URL, timeout=10)
        if response.status_code == 200:
            print("   ✅ Health endpoint: OK")
        else:
            print(f"   ❌ Health endpoint: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Health endpoint error: {e}")
    
    # Test unauthenticated requests (should return 401)
    print("\n2. Testing unauthenticated requests...")
    
    endpoints = [
        ("Tasks GET", f"{TASKS_URL}", "GET"),
        ("Events GET", f"{EVENTS_URL}", "GET"),
        ("Tasks POST", f"{TASKS_URL}", "POST")
    ]
    
    for name, url, method in endpoints:
        try:
            if method == "POST":
                response = requests.post(url, json={}, timeout=10)
            else:
                response = requests.get(url, timeout=10)
            
            if response.status_code == 401:
                print(f"   ✅ {name}: Auth required (expected)")
            elif response.status_code == 500:
                print(f"   ❌ {name}: Server error (unexpected)")
            else:
                print(f"   ⚠️  {name}: {response.status_code}")
        except Exception as e:
            print(f"   ❌ {name} error: {e}")
    
    print("\n==================================")
    print("📊 SUMMARY")
    print("==================================")
    print("✅ If you see 'Auth required' for all endpoints, the schema is fixed")
    print("❌ If you see 'Server error' for any endpoint, there are still issues")
    print("🔧 If there are still issues, the database schema needs more work")

if __name__ == "__main__":
    test_apis_after_fix()
