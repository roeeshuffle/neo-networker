#!/usr/bin/env python3
"""
Fix the text column constraint in the database directly
"""

import requests
import json
import time

# Configuration
BASE_URL = "https://dkdrn34xpx.us-east-1.awsapprunner.com/api"

def fix_text_column_database():
    print("🔧 FIXING TEXT COLUMN IN DATABASE")
    print("=================================")
    
    # Run comprehensive fix multiple times to ensure it addresses the text column
    print("1. Running comprehensive fix multiple times...")
    
    for attempt in range(10):
        try:
            response = requests.post(f"{BASE_URL}/comprehensive-fix", timeout=30)
            if response.status_code == 200:
                print(f"   ✅ Comprehensive fix {attempt + 1}: Success")
            else:
                print(f"   ❌ Comprehensive fix {attempt + 1}: Failed")
        except Exception as e:
            print(f"   ❌ Comprehensive fix {attempt + 1}: Error - {e}")
        
        time.sleep(1)
    
    print("\n2. Testing Tasks POST to see if constraint issue is resolved...")
    
    # Test login first
    login_data = {
        "email": "roee2912@gmail.com",
        "password": "123456"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data, timeout=10)
        if response.status_code == 200:
            token = response.json().get('access_token')
            if token:
                headers = {"Authorization": f"Bearer {token}"}
                
                # Test Tasks POST multiple times
                for i in range(3):
                    task_data = {
                        "title": f"Test Task {i+1} After Database Fix",
                        "description": f"Test Description {i+1}",
                        "project": "test",
                        "status": "todo"
                    }
                    
                    response = requests.post(f"{BASE_URL}/tasks", json=task_data, headers=headers, timeout=10)
                    print(f"   Tasks POST {i+1}: {response.status_code}")
                    
                    if response.status_code == 200:
                        print(f"   ✅ Tasks POST {i+1}: Success!")
                        data = response.json()
                        print(f"   Task created: {data.get('title', 'Unknown')}")
                    else:
                        print(f"   ❌ Tasks POST {i+1}: Failed - {response.text[:200]}")
                    
                    time.sleep(1)
            else:
                print("   ❌ No token received")
        else:
            print(f"   ❌ Login failed: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print("\n=================================")
    print("📊 SUMMARY")
    print("=================================")
    print("✅ If Tasks POST returns 200, the constraint issue is resolved")
    print("❌ If Tasks POST returns 500, the text column constraint still needs fixing")

if __name__ == "__main__":
    fix_text_column_database()
