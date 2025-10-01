#!/usr/bin/env python3
"""
Test Production APIs with Authentication
This will test the actual functionality you're experiencing
"""

import requests
import json
from datetime import datetime

def test_with_auth():
    """Test APIs with authentication to see real errors"""
    base_url = "https://dkdrn34xpx.us-east-1.awsapprunner.com/api"
    
    print("🔐 TESTING PRODUCTION WITH AUTHENTICATION")
    print("=" * 50)
    
    # Try to get a token (this might fail, but let's see what happens)
    try:
        print("🔑 Attempting to get authentication token...")
        login_response = requests.post(f"{base_url}/auth/login", json={
            "email": "test@example.com",
            "password": "testpassword"
        }, timeout=10)
        
        print(f"Login response: {login_response.status_code}")
        if login_response.status_code == 200:
            token_data = login_response.json()
            if 'access_token' in token_data:
                token = token_data['access_token']
                print("✅ Got authentication token")
                
                # Test with token
                headers = {'Authorization': f'Bearer {token}'}
                
                # Test tasks API with auth
                print("\n📋 Testing Tasks API with authentication...")
                tasks_response = requests.get(f"{base_url}/tasks", headers=headers, timeout=10)
                print(f"Tasks API: {tasks_response.status_code}")
                
                if tasks_response.status_code == 500:
                    try:
                        error_data = tasks_response.json()
                        print(f"❌ Tasks Error: {error_data}")
                        if 'column' in str(error_data).lower() and 'does not exist' in str(error_data).lower():
                            print("🚨 CONFIRMED: Database schema error!")
                    except:
                        print(f"❌ Raw error: {tasks_response.text[:200]}")
                elif tasks_response.status_code == 200:
                    tasks_data = tasks_response.json()
                    print(f"✅ Tasks data: {json.dumps(tasks_data, indent=2)[:500]}...")
                else:
                    print(f"⚠️  Unexpected status: {tasks_response.status_code}")
                    print(f"Response: {tasks_response.text[:200]}")
                
                # Test events API with auth
                print("\n📅 Testing Events API with authentication...")
                events_response = requests.get(f"{base_url}/events", headers=headers, timeout=10)
                print(f"Events API: {events_response.status_code}")
                
                if events_response.status_code == 500:
                    try:
                        error_data = events_response.json()
                        print(f"❌ Events Error: {error_data}")
                        if 'column' in str(error_data).lower() and 'does not exist' in str(error_data).lower():
                            print("🚨 CONFIRMED: Database schema error!")
                    except:
                        print(f"❌ Raw error: {events_response.text[:200]}")
                elif events_response.status_code == 200:
                    events_data = events_response.json()
                    print(f"✅ Events data: {json.dumps(events_data, indent=2)[:500]}...")
                else:
                    print(f"⚠️  Unexpected status: {events_response.status_code}")
                    print(f"Response: {events_response.text[:200]}")
                
            else:
                print("❌ No access token in response")
                print(f"Response: {login_response.text[:200]}")
        else:
            print(f"❌ Login failed: {login_response.status_code}")
            print(f"Response: {login_response.text[:200]}")
            
    except Exception as e:
        print(f"❌ Exception during auth test: {str(e)}")
    
    # Test without auth to see the difference
    print("\n" + "=" * 50)
    print("🔓 TESTING WITHOUT AUTHENTICATION (for comparison)")
    print("=" * 50)
    
    try:
        # Test tasks without auth
        tasks_response = requests.get(f"{base_url}/tasks", timeout=10)
        print(f"Tasks without auth: {tasks_response.status_code}")
        
        if tasks_response.status_code == 401:
            print("✅ Expected: 401 Unauthorized (auth required)")
        elif tasks_response.status_code == 500:
            print("❌ Unexpected: 500 error without auth")
            try:
                error_data = tasks_response.json()
                print(f"Error: {error_data}")
            except:
                print(f"Raw error: {tasks_response.text[:200]}")
        else:
            print(f"⚠️  Unexpected status: {tasks_response.status_code}")
        
        # Test events without auth
        events_response = requests.get(f"{base_url}/events", timeout=10)
        print(f"Events without auth: {events_response.status_code}")
        
        if events_response.status_code == 401:
            print("✅ Expected: 401 Unauthorized (auth required)")
        elif events_response.status_code == 500:
            print("❌ Unexpected: 500 error without auth")
            try:
                error_data = events_response.json()
                print(f"Error: {error_data}")
            except:
                print(f"Raw error: {events_response.text[:200]}")
        else:
            print(f"⚠️  Unexpected status: {events_response.status_code}")
            
    except Exception as e:
        print(f"❌ Exception during no-auth test: {str(e)}")

def test_direct_api_calls():
    """Test direct API calls to see what errors you're getting"""
    base_url = "https://dkdrn34xpx.us-east-1.awsapprunner.com/api"
    
    print("\n" + "=" * 50)
    print("🎯 DIRECT API TESTING")
    print("=" * 50)
    
    # Test with different parameters
    test_cases = [
        ("/tasks", "Basic tasks"),
        ("/tasks?include_scheduled=true", "Tasks with scheduled"),
        ("/tasks?status=todo,in_progress", "Tasks with status filter"),
        ("/events", "Basic events"),
        ("/events?start_date=2025-10-01T00:00:00Z&end_date=2025-10-01T23:59:59Z", "Events with date range"),
    ]
    
    for endpoint, description in test_cases:
        try:
            print(f"\n🧪 Testing: {description}")
            print(f"   Endpoint: {endpoint}")
            
            response = requests.get(f"{base_url}{endpoint}", timeout=10)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 500:
                try:
                    error_data = response.json()
                    print(f"   ❌ Error: {error_data}")
                    
                    # Check for specific database errors
                    if 'column' in str(error_data).lower() and 'does not exist' in str(error_data).lower():
                        print("   🚨 DATABASE SCHEMA ERROR CONFIRMED!")
                        if 'tasks.title' in str(error_data):
                            print("   📋 Missing: tasks.title column")
                        if 'events.event_type' in str(error_data):
                            print("   📅 Missing: events.event_type column")
                            
                except:
                    print(f"   ❌ Raw error: {response.text[:200]}")
            elif response.status_code == 401:
                print("   ⚠️  Auth required (expected)")
            elif response.status_code == 200:
                print("   ✅ Success!")
                try:
                    data = response.json()
                    print(f"   📊 Data keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
                except:
                    print("   📊 Response is not JSON")
            else:
                print(f"   ⚠️  Unexpected status: {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ Exception: {str(e)}")

if __name__ == "__main__":
    test_with_auth()
    test_direct_api_calls()
    
    print("\n" + "=" * 50)
    print("📋 SUMMARY")
    print("=" * 50)
    print("If you see 'DATABASE SCHEMA ERROR CONFIRMED!' above,")
    print("then the issue is definitely missing database columns.")
    print("Run: python fix_database.py")
    print("=" * 50)
