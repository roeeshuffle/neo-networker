#!/usr/bin/env python3
"""
Trigger comprehensive database fix
"""

import requests
import json

# Configuration
BASE_URL = "https://dkdrn34xpx.us-east-1.awsapprunner.com/api"
COMPREHENSIVE_FIX_URL = f"{BASE_URL}/comprehensive-fix"

def trigger_comprehensive_fix():
    print("🔧 Triggering Comprehensive Database Fix...")
    print("==========================================")
    
    try:
        response = requests.post(COMPREHENSIVE_FIX_URL, timeout=30)
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Comprehensive fix triggered successfully!")
            print(f"Response: {json.dumps(response.json(), indent=2)}")
        else:
            print(f"❌ Server error during comprehensive fix")
            print(f"Error: {response.json()}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error triggering comprehensive fix: {e}")
    
    print("\n==========================================")
    print("📋 NEXT STEPS")
    print("==========================================")
    print("1. If fix was successful, test the APIs again")
    print("2. Run: python test_now.py to verify the fix")
    print("3. Try creating tasks and fetching events in the app")

if __name__ == "__main__":
    trigger_comprehensive_fix()
