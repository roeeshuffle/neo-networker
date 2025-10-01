#!/usr/bin/env python3
"""
Test authenticated requests to identify the specific issue
"""

import requests
import json
import time

# Configuration
BASE_URL = "https://dkdrn34xpx.us-east-1.awsapprunner.com/api"
LOGIN_URL = f"{BASE_URL}/auth/login"
TASKS_URL = f"{BASE_URL}/tasks"
EVENTS_URL = f"{BASE_URL}/events"

def test_authenticated_requests():
    print("🔐 TESTING AUTHENTICATED REQUESTS")
    print("=================================")
    
    # Test login first
    print("1. Testing login...")
    login_data = {
        "email": "roee2912@gmail.com",
        "password": "test123"  # This might be wrong, but let's try
    }
    
    try:
        response = requests.post(LOGIN_URL, json=login_data, timeout=10)
        print(f"   Login response: {response.status_code}")
        
        if response.status_code == 200:
            token = response.json().get('access_token')
            if token:
                print("   ✅ Login successful, got token")
                headers = {"Authorization": f"Bearer {token}"}
                
                # Test authenticated requests
                print("\n2. Testing authenticated requests...")
                
                # Test Tasks GET
                print("   Testing Tasks GET...")
                try:
                    response = requests.get(f"{TASKS_URL}?include_scheduled=true", headers=headers, timeout=10)
                    print(f"   Tasks GET: {response.status_code}")
                    if response.status_code != 200:
                        print(f"   Error: {response.text[:200]}")
                except Exception as e:
                    print(f"   Tasks GET error: {e}")
                
                # Test Events GET
                print("   Testing Events GET...")
                try:
                    response = requests.get(f"{EVENTS_URL}?start_date=2025-09-30T21:00:00.000Z&end_date=2025-10-01T20:59:59.000Z", headers=headers, timeout=10)
                    print(f"   Events GET: {response.status_code}")
                    if response.status_code != 200:
                        print(f"   Error: {response.text[:200]}")
                except Exception as e:
                    print(f"   Events GET error: {e}")
                
                # Test Tasks POST
                print("   Testing Tasks POST...")
                try:
                    task_data = {
                        "title": "Test Task",
                        "description": "Test Description",
                        "project": "test",
                        "status": "todo"
                    }
                    response = requests.post(TASKS_URL, json=task_data, headers=headers, timeout=10)
                    print(f"   Tasks POST: {response.status_code}")
                    if response.status_code != 200:
                        print(f"   Error: {response.text[:200]}")
                except Exception as e:
                    print(f"   Tasks POST error: {e}")
                    
            else:
                print("   ❌ No token in response")
        else:
            print(f"   ❌ Login failed: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Login error: {e}")
    
    print("\n=================================")
    print("📊 SUMMARY")
    print("=================================")
    print("✅ If all authenticated requests return 200, the issue is resolved")
    print("❌ If any return 500, there's still a database or code issue")

if __name__ == "__main__":
    test_authenticated_requests()
