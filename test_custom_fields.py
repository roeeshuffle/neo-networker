#!/usr/bin/env python3
"""
Simple test script to add a custom field and verify it appears in user preferences
"""
import requests
import json

# Configuration
API_URL = "https://dkdrn34xpx.us-east-1.awsapprunner.com"
EMAIL = "roee2912@gmail.com"
PASSWORD = "123456"

def test_custom_fields():
    print("🧪 Testing Custom Fields Functionality")
    print("=" * 50)
    
    # Step 1: Login to get token
    print("1. Logging in...")
    login_data = {
        "email": EMAIL,
        "password": PASSWORD
    }
    
    try:
        response = requests.post(f"{API_URL}/api/auth/login", json=login_data)
        if response.status_code != 200:
            print(f"❌ Login failed: {response.status_code}")
            print(f"Response: {response.text}")
            return
        
        token = response.json().get('access_token')
        if not token:
            print("❌ No token received")
            return
        
        print("✅ Login successful")
        
    except Exception as e:
        print(f"❌ Login error: {e}")
        return
    
    # Step 2: Get current custom fields
    print("\n2. Getting current custom fields...")
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(f"{API_URL}/api/custom-fields", headers=headers)
        if response.status_code != 200:
            print(f"❌ Failed to get custom fields: {response.status_code}")
            print(f"Response: {response.text}")
            return
        
        current_fields = response.json().get('custom_fields', [])
        print(f"✅ Current custom fields: {current_fields}")
        
    except Exception as e:
        print(f"❌ Error getting custom fields: {e}")
        return
    
    # Step 3: Add test field
    print("\n3. Adding 'field_test' custom field...")
    field_data = {"name": "field_test"}
    
    try:
        response = requests.post(f"{API_URL}/api/custom-fields", 
                                json=field_data, 
                                headers=headers)
        if response.status_code not in [200, 201]:
            print(f"❌ Failed to add custom field: {response.status_code}")
            print(f"Response: {response.text}")
            return
        
        result = response.json()
        print(f"✅ Custom field added: {result}")
        
    except Exception as e:
        print(f"❌ Error adding custom field: {e}")
        return
    
    # Step 4: Verify field was added
    print("\n4. Verifying field was added...")
    
    try:
        response = requests.get(f"{API_URL}/api/custom-fields", headers=headers)
        if response.status_code != 200:
            print(f"❌ Failed to verify custom fields: {response.status_code}")
            return
        
        updated_fields = response.json().get('custom_fields', [])
        print(f"✅ Updated custom fields: {updated_fields}")
        
        if "field_test" in updated_fields:
            print("🎉 SUCCESS: 'field_test' is now in the custom fields list!")
        else:
            print("❌ FAILURE: 'field_test' was not added to the list")
            
    except Exception as e:
        print(f"❌ Error verifying custom fields: {e}")
        return
    
    print("\n" + "=" * 50)
    print("✅ Test completed!")

if __name__ == "__main__":
    test_custom_fields()
