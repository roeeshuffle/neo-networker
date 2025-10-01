#!/usr/bin/env python3
"""
Simple deployment test script
"""

import requests
import time

def test_deployment():
    print("🧪 Testing Neo Networker Deployment")
    print("=" * 40)
    
    # Test the health endpoint
    try:
        response = requests.get("https://dkdrn34xpx.us-east-1.awsapprunner.com/health", timeout=10)
        if response.status_code == 200:
            print("✅ Health check: PASSED")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Health check: FAILED (Status: {response.status_code})")
    except Exception as e:
        print(f"❌ Health check: ERROR - {e}")
    
    # Test the API health endpoint
    try:
        response = requests.get("https://dkdrn34xpx.us-east-1.awsapprunner.com/api/health", timeout=10)
        if response.status_code == 200:
            print("✅ API Health check: PASSED")
        else:
            print(f"❌ API Health check: FAILED (Status: {response.status_code})")
    except Exception as e:
        print(f"❌ API Health check: ERROR - {e}")
    
    print("=" * 40)
    print("🎯 Deployment test completed!")

if __name__ == "__main__":
    test_deployment()
