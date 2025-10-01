#!/usr/bin/env python3
"""
Test APIs with actual authentication to see what's happening
"""

import requests
import json
from datetime import datetime, timedelta

def test_authenticated_apis():
    """Test APIs with authentication to see real errors"""
    base_url = "https://dkdrn34xpx.us-east-1.awsapprunner.com/api"
    
    print("🔐 TESTING AUTHENTICATED APIS")
    print("=" * 50)
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)
    
    # Create a session to maintain cookies/auth
    session = requests.Session()
    
    # Try to authenticate (this might fail, but let's see what happens)
    try:
        print("🔑 Attempting authentication...")
        
        # Try Google OAuth status first
        auth_status_response = session.get(f"{base_url}/auth/google/status", timeout=10)
        print(f"Google Auth Status: {auth_status_response.status_code}")
        
        if auth_status_response.status_code == 200:
            print("✅ Google OAuth is available")
            
            # Try to get Google OAuth URL
            google_auth_response = session.get(f"{base_url}/auth/google", timeout=10)
            print(f"Google Auth URL: {google_auth_response.status_code}")
            
            if google_auth_response.status_code == 200:
                try:
                    auth_data = google_auth_response.json()
                    print(f"Auth URL: {auth_data.get('auth_url', 'No URL')}")
                except:
                    print("No JSON response from Google auth")
        
        # Try login endpoint
        login_response = session.post(f"{base_url}/auth/login", json={
            "email": "test@example.com",
            "password": "testpassword"
        }, timeout=10)
        
        print(f"Login attempt: {login_response.status_code}")
        
        if login_response.status_code == 200:
            try:
                login_data = login_response.json()
                if 'access_token' in login_data:
                    token = login_data['access_token']
                    print("✅ Got access token")
                    
                    # Set authorization header
                    session.headers.update({'Authorization': f'Bearer {token}'})
                    
                    # Test APIs with authentication
                    test_apis_with_auth(session, base_url)
                else:
                    print("❌ No access token in response")
                    print(f"Response: {login_data}")
            except Exception as e:
                print(f"❌ Error parsing login response: {e}")
        else:
            print(f"❌ Login failed: {login_response.status_code}")
            print(f"Response: {login_response.text[:200]}")
            
    except Exception as e:
        print(f"❌ Exception during auth: {str(e)}")

def test_apis_with_auth(session, base_url):
    """Test APIs with authentication"""
    print("\n🧪 TESTING APIS WITH AUTHENTICATION")
    print("=" * 50)
    
    # Test tasks
    print("\n📋 Testing Tasks API...")
    try:
        # Test GET tasks
        tasks_response = session.get(f"{base_url}/tasks", timeout=10)
        print(f"GET /tasks: {tasks_response.status_code}")
        
        if tasks_response.status_code == 200:
            try:
                tasks_data = tasks_response.json()
                print(f"✅ Tasks data: {json.dumps(tasks_data, indent=2)[:300]}...")
            except:
                print("❌ Tasks response is not JSON")
        elif tasks_response.status_code == 500:
            try:
                error_data = tasks_response.json()
                print(f"❌ Tasks error: {error_data}")
            except:
                print(f"❌ Tasks raw error: {tasks_response.text[:200]}")
        
        # Test POST tasks (create)
        print("\n📝 Testing Task Creation...")
        create_task_data = {
            "title": "Test Task",
            "description": "Test Description",
            "project": "test",
            "status": "todo",
            "priority": "medium"
        }
        
        create_response = session.post(f"{base_url}/tasks", json=create_task_data, timeout=10)
        print(f"POST /tasks: {create_response.status_code}")
        
        if create_response.status_code == 201:
            print("✅ Task created successfully")
        elif create_response.status_code == 500:
            try:
                error_data = create_response.json()
                print(f"❌ Create task error: {error_data}")
            except:
                print(f"❌ Create task raw error: {create_response.text[:200]}")
        else:
            print(f"⚠️  Unexpected status: {create_response.status_code}")
            print(f"Response: {create_response.text[:200]}")
            
    except Exception as e:
        print(f"❌ Exception testing tasks: {str(e)}")
    
    # Test events
    print("\n📅 Testing Events API...")
    try:
        # Test GET events
        events_response = session.get(f"{base_url}/events", timeout=10)
        print(f"GET /events: {events_response.status_code}")
        
        if events_response.status_code == 200:
            try:
                events_data = events_response.json()
                print(f"✅ Events data: {json.dumps(events_data, indent=2)[:300]}...")
            except:
                print("❌ Events response is not JSON")
        elif events_response.status_code == 500:
            try:
                error_data = events_response.json()
                print(f"❌ Events error: {error_data}")
            except:
                print(f"❌ Events raw error: {events_response.text[:200]}")
        
        # Test GET events with date range
        print("\n📅 Testing Events with Date Range...")
        today = datetime.now()
        start_date = today.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = today.replace(hour=23, minute=59, second=59, microsecond=0)
        
        events_date_response = session.get(
            f"{base_url}/events?start_date={start_date.isoformat()}&end_date={end_date.isoformat()}", 
            timeout=10
        )
        print(f"GET /events with dates: {events_date_response.status_code}")
        
        if events_date_response.status_code == 200:
            print("✅ Events with date range working")
        elif events_date_response.status_code == 500:
            try:
                error_data = events_date_response.json()
                print(f"❌ Events date range error: {error_data}")
            except:
                print(f"❌ Events date range raw error: {events_date_response.text[:200]}")
        
        # Test POST events (create)
        print("\n📝 Testing Event Creation...")
        create_event_data = {
            "title": "Test Event",
            "description": "Test Event Description",
            "start_datetime": start_date.isoformat(),
            "end_datetime": end_date.isoformat(),
            "event_type": "event",
            "location": "Test Location"
        }
        
        create_event_response = session.post(f"{base_url}/events", json=create_event_data, timeout=10)
        print(f"POST /events: {create_event_response.status_code}")
        
        if create_event_response.status_code == 201:
            print("✅ Event created successfully")
        elif create_event_response.status_code == 500:
            try:
                error_data = create_event_response.json()
                print(f"❌ Create event error: {error_data}")
            except:
                print(f"❌ Create event raw error: {create_event_response.text[:200]}")
        else:
            print(f"⚠️  Unexpected status: {create_event_response.status_code}")
            print(f"Response: {create_event_response.text[:200]}")
            
    except Exception as e:
        print(f"❌ Exception testing events: {str(e)}")

if __name__ == "__main__":
    test_authenticated_apis()
    
    print("\n" + "=" * 50)
    print("📋 SUMMARY")
    print("=" * 50)
    print("If you see 500 errors above, the database schema still has issues.")
    print("If you see 200/201 responses, the APIs are working correctly.")
    print("If you see 401 errors, authentication is required (expected).")
    print("=" * 50)
