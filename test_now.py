#!/usr/bin/env python3
"""
Test Now - Quick deployment verification
Run this immediately after deployment
"""

import requests
import json

def test_now():
    """Quick test of production deployment"""
    base_url = "https://dkdrn34xpx.us-east-1.awsapprunner.com/api"
    
    print("🚀 TESTING PRODUCTION NOW...")
    print("=" * 40)
    
    # Test critical endpoints
    tests = [
        ("/health", "Backend Health"),
        ("/people", "People API"),
        ("/tasks", "Tasks API"),
        ("/events", "Events API"),
        ("/companies", "Companies API"),
    ]
    
    results = []
    
    for endpoint, name in tests:
        try:
            response = requests.get(f"{base_url}{endpoint}", timeout=10)
            
            if response.status_code == 200:
                print(f"✅ {name}: OK")
                results.append(True)
            elif response.status_code == 401:
                print(f"⚠️  {name}: Auth required (expected)")
                results.append(True)
            elif response.status_code == 500:
                print(f"❌ {name}: Server Error")
                try:
                    error = response.json()
                    if 'column' in str(error).lower() and 'does not exist' in str(error).lower():
                        print(f"   🚨 DATABASE SCHEMA ERROR!")
                        print(f"   Run: python fix_database.py")
                except:
                    pass
                results.append(False)
            else:
                print(f"❌ {name}: Status {response.status_code}")
                results.append(False)
                
        except Exception as e:
            print(f"❌ {name}: Exception - {str(e)}")
            results.append(False)
    
    # Summary
    passed = sum(results)
    total = len(results)
    
    print("\n" + "=" * 40)
    print(f"📊 RESULT: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 DEPLOYMENT SUCCESSFUL!")
    else:
        print("🚨 DEPLOYMENT ISSUES DETECTED!")
        print("💡 Run: python fix_database.py")

if __name__ == "__main__":
    test_now()
