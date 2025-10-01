#!/usr/bin/env python3
"""
Verify that the project restructure is successful and all systems are working.
"""

import requests
import json
import time
import os
import sys

# Configuration
BASE_URL = "https://dkdrn34xpx.us-east-1.awsapprunner.com/api"
LOGIN_URL = f"{BASE_URL}/auth/login"
TASKS_URL = f"{BASE_URL}/tasks"
EVENTS_URL = f"{BASE_URL}/events"

def verify_restructure():
    print("🔍 VERIFYING PROJECT RESTRUCTURE")
    print("=================================")
    
    # Check if new structure exists
    print("1. Checking new project structure...")
    
    required_dirs = [
        "backend/dal",
        "backend/bl", 
        "backend/dsl",
        "backend/api",
        "backend/config",
        "frontend/src",
        "tests/integration",
        "docker",
        "docs",
        "scripts"
    ]
    
    for dir_path in required_dirs:
        if os.path.exists(dir_path):
            print(f"   ✅ {dir_path}")
        else:
            print(f"   ❌ {dir_path}")
    
    # Test API functionality
    print("\n2. Testing API functionality...")
    
    # Test login
    login_data = {
        "email": "roee2912@gmail.com",
        "password": "123456"
    }
    
    try:
        response = requests.post(LOGIN_URL, json=login_data, timeout=10)
        if response.status_code == 200:
            token = response.json().get('access_token')
            if token:
                print("   ✅ Authentication: Working")
                headers = {"Authorization": f"Bearer {token}"}
                
                # Test all endpoints
                endpoints = [
                    ("Tasks GET", f"{TASKS_URL}?include_scheduled=true", "GET"),
                    ("Events GET", f"{EVENTS_URL}?start_date=2025-09-30T21:00:00.000Z&end_date=2025-10-01T20:59:59.000Z", "GET"),
                    ("Tasks POST", TASKS_URL, "POST"),
                    ("Events POST", EVENTS_URL, "POST")
                ]
                
                for name, url, method in endpoints:
                    try:
                        if method == "POST":
                            if "tasks" in url:
                                data = {"title": "Test Task", "description": "Test", "project": "test", "status": "todo"}
                            else:
                                data = {"title": "Test Event", "description": "Test", "start_datetime": "2025-10-02T10:00:00Z", "end_datetime": "2025-10-02T11:00:00Z", "event_type": "event"}
                            response = requests.post(url, json=data, headers=headers, timeout=10)
                        else:
                            response = requests.get(url, headers=headers, timeout=10)
                        
                        if response.status_code in [200, 201]:
                            print(f"   ✅ {name}: Working ({response.status_code})")
                        else:
                            print(f"   ❌ {name}: Failed ({response.status_code})")
                    except Exception as e:
                        print(f"   ❌ {name}: Error - {e}")
                        
            else:
                print("   ❌ Authentication: No token received")
        else:
            print(f"   ❌ Authentication: Failed ({response.status_code})")
            
    except Exception as e:
        print(f"   ❌ Authentication: Error - {e}")
    
    # Check critical files
    print("\n3. Checking critical files...")
    
    critical_files = [
        "backend/main.py",
        "backend/api/app.py",
        "backend/dal/database.py",
        "backend/dal/models/__init__.py",
        "frontend/package.json",
        "docker/docker-compose.new.yml",
        "README.md"
    ]
    
    for file_path in critical_files:
        if os.path.exists(file_path):
            print(f"   ✅ {file_path}")
        else:
            print(f"   ❌ {file_path}")
    
    print("\n=================================")
    print("📊 RESTRUCTURE VERIFICATION SUMMARY")
    print("=================================")
    print("✅ If all checks pass, the restructure is successful!")
    print("❌ If any checks fail, there may be issues to resolve.")
    print("\n🎯 Next Steps:")
    print("1. Update deployment configurations")
    print("2. Update CI/CD pipelines")
    print("3. Update documentation")
    print("4. Train team on new structure")

if __name__ == "__main__":
    verify_restructure()
