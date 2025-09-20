#!/usr/bin/env python3
"""
Simple test script to verify the Neo Networker backend is working correctly.
This focuses on core functionality without complex session management.
"""

import requests
import json
import time
import subprocess
import os
import sys
from datetime import datetime

def print_header(title):
    """Print a formatted header"""
    print("\n" + "=" * 60)
    print(f"🚀 {title}")
    print("=" * 60)

def print_section(title):
    """Print a formatted section header"""
    print(f"\n📋 {title}")
    print("-" * 40)

def test_health_endpoint(base_url):
    """Test health endpoint"""
    print("🔍 Testing health endpoint...")
    try:
        response = requests.get(f"{base_url}/api/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed: {data['status']}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def test_user_registration(base_url):
    """Test user registration"""
    print("🔍 Testing user registration...")
    try:
        user_data = {
            'email': f'test_{int(time.time())}@example.com',
            'full_name': 'Test User'
        }
        
        response = requests.post(f"{base_url}/api/auth/register",
                               json=user_data,
                               timeout=5)
        
        if response.status_code == 201:
            data = response.json()
            print(f"✅ User registration successful: {data['user']['email']}")
            return data['access_token']
        else:
            print(f"❌ User registration failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ User registration error: {e}")
        return None

def test_user_login(base_url):
    """Test user login"""
    print("🔍 Testing user login...")
    try:
        login_data = {'email': 'guy@wershuffle.com'}
        
        response = requests.post(f"{base_url}/api/auth/login",
                               json=login_data,
                               timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ User login successful: {data['user']['email']}")
            return data['access_token']
        else:
            print(f"❌ User login failed: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ User login error: {e}")
        return None

def test_people_crud(base_url, token):
    """Test people CRUD operations"""
    print("🔍 Testing people CRUD...")
    headers = {'Authorization': f'Bearer {token}'}
    
    try:
        # Create person
        person_data = {
            'full_name': 'John Doe',
            'company': 'Test Company',
            'email': 'john@test.com',
            'categories': 'Investor',
            'status': 'Active'
        }
        
        response = requests.post(f"{base_url}/api/people",
                               json=person_data,
                               headers=headers,
                               timeout=5)
        
        if response.status_code == 201:
            data = response.json()
            person_id = data['id']
            print(f"✅ Person created: {data['full_name']}")
            
            # Get people
            response = requests.get(f"{base_url}/api/people",
                                  headers=headers,
                                  timeout=5)
            
            if response.status_code == 200:
                people = response.json()
                print(f"✅ People list retrieved: {len(people)} people")
                
                # Update person
                update_data = {'full_name': 'John Updated'}
                response = requests.put(f"{base_url}/api/people/{person_id}",
                                      json=update_data,
                                      headers=headers,
                                      timeout=5)
                
                if response.status_code == 200:
                    print("✅ Person updated successfully")
                    
                    # Delete person
                    response = requests.delete(f"{base_url}/api/people/{person_id}",
                                             headers=headers,
                                             timeout=5)
                    
                    if response.status_code == 200:
                        print("✅ Person deleted successfully")
                        return True
                    else:
                        print(f"❌ Person deletion failed: {response.status_code}")
                        return False
                else:
                    print(f"❌ Person update failed: {response.status_code}")
                    return False
            else:
                print(f"❌ People list failed: {response.status_code}")
                return False
        else:
            print(f"❌ Person creation failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ People CRUD error: {e}")
        return False

def test_companies_crud(base_url, token):
    """Test companies CRUD operations"""
    print("🔍 Testing companies CRUD...")
    headers = {'Authorization': f'Bearer {token}'}
    
    try:
        # Create company
        company_data = {
            'record': 'Test Company Inc',
            'categories': 'Technology',
            'description': 'A test company'
        }
        
        response = requests.post(f"{base_url}/api/companies",
                               json=company_data,
                               headers=headers,
                               timeout=5)
        
        if response.status_code == 201:
            data = response.json()
            company_id = data['id']
            print(f"✅ Company created: {data['record']}")
            
            # Get companies
            response = requests.get(f"{base_url}/api/companies",
                                  headers=headers,
                                  timeout=5)
            
            if response.status_code == 200:
                companies = response.json()
                print(f"✅ Companies list retrieved: {len(companies)} companies")
                return True
            else:
                print(f"❌ Companies list failed: {response.status_code}")
                return False
        else:
            print(f"❌ Company creation failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Companies CRUD error: {e}")
        return False

def test_tasks_crud(base_url, token):
    """Test tasks CRUD operations"""
    print("🔍 Testing tasks CRUD...")
    headers = {'Authorization': f'Bearer {token}'}
    
    try:
        # Create task
        task_data = {
            'text': 'Complete project documentation',
            'priority': 'high',
            'status': 'todo'
        }
        
        response = requests.post(f"{base_url}/api/tasks",
                               json=task_data,
                               headers=headers,
                               timeout=5)
        
        if response.status_code == 201:
            data = response.json()
            task_id = data['id']
            print(f"✅ Task created: {data['text']}")
            
            # Get tasks
            response = requests.get(f"{base_url}/api/tasks",
                                  headers=headers,
                                  timeout=5)
            
            if response.status_code == 200:
                tasks = response.json()
                print(f"✅ Tasks list retrieved: {len(tasks)} tasks")
                return True
            else:
                print(f"❌ Tasks list failed: {response.status_code}")
                return False
        else:
            print(f"❌ Task creation failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Tasks CRUD error: {e}")
        return False

def test_csv_processing(base_url, token):
    """Test CSV processing"""
    print("🔍 Testing CSV processing...")
    headers = {'Authorization': f'Bearer {token}'}
    
    try:
        csv_data = {
            'csvData': 'Full Name,Company,Email\nJohn Doe,Test Corp,john@test.com\nJane Smith,Another Corp,jane@test.com',
            'customMapping': {}
        }
        
        response = requests.post(f"{base_url}/api/csv-processor",
                               json=csv_data,
                               headers=headers,
                               timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ CSV processing successful: {data['message']}")
            return True
        else:
            print(f"❌ CSV processing failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ CSV processing error: {e}")
        return False

def start_flask_app():
    """Start Flask app in background"""
    print("🚀 Starting Flask application...")
    try:
        # Kill any existing Flask processes
        subprocess.run(['pkill', '-f', 'python3 app.py'], capture_output=True)
        time.sleep(2)
        
        # Start Flask app
        process = subprocess.Popen(['python3', 'app.py'],
                                 stdout=subprocess.PIPE,
                                 stderr=subprocess.PIPE)
        
        # Wait for app to start
        time.sleep(5)
        
        # Check if process is running
        if process.poll() is None:
            print("✅ Flask app started successfully")
            return process
        else:
            print("❌ Flask app failed to start")
            stdout, stderr = process.communicate()
            print(f"   Error: {stderr.decode()}")
            return None
    except Exception as e:
        print(f"❌ Failed to start Flask app: {e}")
        return None

def main():
    """Main test function"""
    start_time = datetime.now()
    
    print_header("Neo Networker Backend - Simple Functionality Test")
    print(f"🕐 Started at: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test configuration
    base_url = "http://localhost:5002"
    
    # Start Flask app
    flask_process = start_flask_app()
    if not flask_process:
        print("\n❌ Cannot start Flask app. Please check the setup.")
        return False
    
    try:
        # Run tests
        test_results = []
        
        # 1. Health check
        test_results.append(("Health Check", test_health_endpoint(base_url)))
        
        # 2. User registration
        new_user_token = test_user_registration(base_url)
        test_results.append(("User Registration", new_user_token is not None))
        
        # 3. User login (admin)
        admin_token = test_user_login(base_url)
        test_results.append(("User Login", admin_token is not None))
        
        # Use available token for CRUD tests
        token = new_user_token or admin_token
        if not token:
            print("\n❌ No valid token available for CRUD tests")
            return False
        
        print(f"🔑 Using token for CRUD tests: {'New user' if new_user_token else 'Admin'}")
        
        # 4. People CRUD
        test_results.append(("People CRUD", test_people_crud(base_url, token)))
        
        # 5. Companies CRUD
        test_results.append(("Companies CRUD", test_companies_crud(base_url, token)))
        
        # 6. Tasks CRUD
        test_results.append(("Tasks CRUD", test_tasks_crud(base_url, token)))
        
        # 7. CSV Processing
        test_results.append(("CSV Processing", test_csv_processing(base_url, token)))
        
        # Print results
        end_time = datetime.now()
        duration = end_time - start_time
        
        print_header("Test Results Summary")
        
        passed = sum(1 for _, result in test_results if result)
        total = len(test_results)
        
        print(f"📊 Total tests: {total}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {total - passed}")
        print(f"⏱️  Duration: {duration.total_seconds():.2f} seconds")
        
        print("\n📋 Detailed Results:")
        for test_name, result in test_results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"   {status} {test_name}")
        
        if passed == total:
            print("\n🎉 ALL TESTS PASSED!")
            print("✅ Backend is fully functional and ready for use.")
            print(f"\n🚀 API is running at: {base_url}")
            print("📚 Available endpoints:")
            print("   - GET  /api/health")
            print("   - POST /api/auth/register")
            print("   - POST /api/auth/login")
            print("   - GET  /api/people")
            print("   - POST /api/people")
            print("   - GET  /api/companies")
            print("   - POST /api/companies")
            print("   - GET  /api/tasks")
            print("   - POST /api/tasks")
            print("   - POST /api/csv-processor")
            return True
        else:
            print(f"\n⚠️  {total - passed} test(s) failed.")
            print("❌ Please check the issues above.")
            return False
    
    finally:
        # Clean up
        if flask_process:
            print("\n🧹 Cleaning up...")
            flask_process.terminate()
            flask_process.wait()
            print("✅ Flask app stopped")

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
