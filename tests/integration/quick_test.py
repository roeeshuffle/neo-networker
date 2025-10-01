#!/usr/bin/env python3
"""
Quick Production Test - Run this after every deployment
"""

import requests
import json
from datetime import datetime

def test_endpoint(url, name, expected_codes=[200]):
    """Test a single endpoint"""
    try:
        response = requests.get(url, timeout=10)
        success = response.status_code in expected_codes
        
        status = "✅" if success else "❌"
        print(f"{status} {name}: {response.status_code}")
        
        if not success:
            try:
                error_data = response.json()
                if 'column' in str(error_data).lower() and 'does not exist' in str(error_data).lower():
                    print(f"   🚨 DATABASE SCHEMA ERROR: {error_data}")
                else:
                    print(f"   Error: {error_data}")
            except:
                print(f"   Raw response: {response.text[:200]}")
        
        return success
    except Exception as e:
        print(f"❌ {name}: Exception - {str(e)}")
        return False

def main():
    """Run quick tests"""
    base_url = "https://dkdrn34xpx.us-east-1.awsapprunner.com/api"
    
    print("🚀 QUICK PRODUCTION TEST")
    print("=" * 40)
    print(f"Testing: {base_url}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 40)
    
    # Test all endpoints
    tests = [
        (f"{base_url}/health", "Health Check", [200]),
        (f"{base_url}/people", "People API", [200, 401]),
        (f"{base_url}/tasks", "Tasks API", [200, 401, 500]),
        (f"{base_url}/tasks?include_scheduled=true", "Tasks with params", [200, 401, 500]),
        (f"{base_url}/events", "Events API", [200, 401, 500]),
        (f"{base_url}/companies", "Companies API", [200, 401]),
        (f"{base_url}/admin/users", "Admin API", [200, 401, 403]),
        (f"{base_url}/safe-migration", "Safe Migration", [200, 404, 405]),  # 405 = method not allowed for GET
        (f"{base_url}/quick-fix", "Quick Fix", [200, 404, 405]),
    ]
    
    results = []
    for url, name, expected_codes in tests:
        success = test_endpoint(url, name, expected_codes)
        results.append((name, success))
    
    # Summary
    print("\n" + "=" * 40)
    print("📊 SUMMARY")
    print("=" * 40)
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    print(f"Passed: {passed}/{total}")
    print(f"Success Rate: {(passed/total)*100:.1f}%")
    
    # Check for critical issues
    critical_issues = []
    for name, success in results:
        if not success:
            if "Tasks" in name or "Events" in name:
                critical_issues.append(f"Database schema issue in {name}")
            elif "Health" in name:
                critical_issues.append("Backend is down")
    
    if critical_issues:
        print("\n🚨 CRITICAL ISSUES:")
        for issue in critical_issues:
            print(f"  - {issue}")
        print("\n💡 RECOMMENDED ACTIONS:")
        print("  1. Run the database fix script")
        print("  2. Check backend logs")
        print("  3. Verify deployment status")
    else:
        print("\n✅ All critical systems operational!")

if __name__ == "__main__":
    main()
