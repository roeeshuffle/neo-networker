#!/usr/bin/env python3
"""
Test with real authentication using user credentials
"""

import requests
import json
import time

# Configuration
BASE_URL = "https://dkdrn34xpx.us-east-1.awsapprunner.com/api"
LOGIN_URL = f"{BASE_URL}/auth/login"
TASKS_URL = f"{BASE_URL}/tasks"
EVENTS_URL = f"{BASE_URL}/events"

def test_with_real_auth():
    print("🔐 TESTING WITH REAL AUTHENTICATION")
    print("===================================")
    
    # Test login with real credentials
    print("1. Testing login with real credentials...")
    login_data = {
        "email": "roee2912@gmail.com",
        "password": "123456"
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
                    if response.status_code == 200:
                        data = response.json()
                        print(f"   ✅ Tasks retrieved: {data.get('count', 0)} tasks")
                    else:
                        print(f"   ❌ Error: {response.text[:200]}")
                except Exception as e:
                    print(f"   ❌ Tasks GET error: {e}")
                
                # Test Events GET
                print("   Testing Events GET...")
                try:
                    response = requests.get(f"{EVENTS_URL}?start_date=2025-09-30T21:00:00.000Z&end_date=2025-10-01T20:59:59.000Z", headers=headers, timeout=10)
                    print(f"   Events GET: {response.status_code}")
                    if response.status_code == 200:
                        data = response.json()
                        print(f"   ✅ Events retrieved: {data.get('count', 0)} events")
                    else:
                        print(f"   ❌ Error: {response.text[:200]}")
                except Exception as e:
                    print(f"   ❌ Events GET error: {e}")
                
                # Test Tasks POST
                print("   Testing Tasks POST...")
                try:
                    task_data = {
                        "title": "Test Task from Script",
                        "description": "Test Description",
                        "project": "test",
                        "status": "todo"
                    }
                    response = requests.post(TASKS_URL, json=task_data, headers=headers, timeout=10)
                    print(f"   Tasks POST: {response.status_code}")
                    if response.status_code == 200:
                        data = response.json()
                        print(f"   ✅ Task created: {data.get('title', 'Unknown')}")
                    else:
                        print(f"   ❌ Error: {response.text[:200]}")
                except Exception as e:
                    print(f"   ❌ Tasks POST error: {e}")
                
                # Test Events POST
                print("   Testing Events POST...")
                try:
                    event_data = {
                        "title": "Test Event from Script",
                        "description": "Test Event Description",
                        "start_datetime": "2025-10-02T10:00:00Z",
                        "end_datetime": "2025-10-02T11:00:00Z",
                        "event_type": "meeting",
                        "location": "Test Location"
                    }
                    response = requests.post(EVENTS_URL, json=event_data, headers=headers, timeout=10)
                    print(f"   Events POST: {response.status_code}")
                    if response.status_code == 200:
                        data = response.json()
                        print(f"   ✅ Event created: {data.get('title', 'Unknown')}")
                    else:
                        print(f"   ❌ Error: {response.text[:200]}")
                except Exception as e:
                    print(f"   ❌ Events POST error: {e}")
                    
            else:
                print("   ❌ No token in response")
                print(f"   Response: {response.text}")
        else:
            print(f"   ❌ Login failed: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Login error: {e}")
    
    print("\n===================================")
    print("📊 SUMMARY")
    print("===================================")
    print("✅ If all authenticated requests return 200, the issue is resolved")
    print("❌ If any return 500, there's still a database or code issue")
    print("🔧 This test uses real authentication to identify the exact problem")

if __name__ == "__main__":
    test_with_real_auth()
