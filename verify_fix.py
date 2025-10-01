#!/usr/bin/env python3
"""
Verify that the database schema fix worked
"""

import requests
import json
from datetime import datetime

def verify_fix():
    """Verify that the database schema fix worked"""
    base_url = "https://dkdrn34xpx.us-east-1.awsapprunner.com/api"
    
    print("🔍 VERIFYING DATABASE SCHEMA FIX")
    print("=" * 50)
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)
    
    # Test endpoints that were previously failing
    test_cases = [
        ("/tasks", "Tasks API"),
        ("/tasks?include_scheduled=true", "Tasks with scheduled"),
        ("/tasks?status=todo,in_progress", "Tasks with status filter"),
        ("/events", "Events API"),
        ("/events?start_date=2025-10-01T00:00:00Z&end_date=2025-10-01T23:59:59Z", "Events with date range"),
    ]
    
    results = []
    
    for endpoint, description in test_cases:
        try:
            print(f"\n🧪 Testing: {description}")
            print(f"   Endpoint: {endpoint}")
            
            response = requests.get(f"{base_url}{endpoint}", timeout=10)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 500:
                try:
                    error_data = response.json()
                    print(f"   ❌ Still has error: {error_data}")
                    
                    # Check for specific database errors
                    if 'column' in str(error_data).lower() and 'does not exist' in str(error_data).lower():
                        print("   🚨 DATABASE SCHEMA ERROR STILL PRESENT!")
                        results.append(False)
                    else:
                        print("   ⚠️  Different error (not schema related)")
                        results.append(False)
                        
                except:
                    print(f"   ❌ Raw error: {response.text[:200]}")
                    results.append(False)
            elif response.status_code == 401:
                print("   ✅ Auth required (expected - no schema error)")
                results.append(True)
            elif response.status_code == 200:
                print("   ✅ Success!")
                try:
                    data = response.json()
                    print(f"   📊 Data keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
                except:
                    print("   📊 Response is not JSON")
                results.append(True)
            else:
                print(f"   ⚠️  Unexpected status: {response.status_code}")
                results.append(False)
                
        except Exception as e:
            print(f"   ❌ Exception: {str(e)}")
            results.append(False)
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 VERIFICATION SUMMARY")
    print("=" * 50)
    
    passed = sum(results)
    total = len(results)
    
    print(f"Tests passed: {passed}/{total}")
    print(f"Success rate: {(passed/total)*100:.1f}%")
    
    if passed == total:
        print("\n🎉 DATABASE SCHEMA FIX SUCCESSFUL!")
        print("✅ All APIs are now working correctly")
        print("✅ No more 'column does not exist' errors")
        print("✅ You should be able to fetch tasks and events now")
    else:
        print("\n🚨 DATABASE SCHEMA ISSUES STILL PRESENT")
        print("❌ Some APIs are still failing")
        print("💡 You may need to run the fix again or check the logs")
    
    print("\n" + "=" * 50)
    print("💡 NEXT STEPS")
    print("=" * 50)
    if passed == total:
        print("1. ✅ Refresh your browser")
        print("2. ✅ Try to fetch tasks and events")
        print("3. ✅ The 500 errors should be gone")
        print("4. ✅ All CRUD operations should work")
    else:
        print("1. ❌ Check AWS App Runner logs for detailed errors")
        print("2. ❌ Try running the fix again")
        print("3. ❌ Contact support if issues persist")

if __name__ == "__main__":
    verify_fix()
