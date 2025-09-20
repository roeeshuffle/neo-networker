#!/usr/bin/env python3
"""
Test script to simulate Telegram webhook messages
"""
import requests
import json

def test_telegram_webhook():
    """Test the Telegram webhook with a simulated message"""
    
    # Simulate your "Hey" message
    test_message = {
        "message": {
            "chat": {
                "id": 123456789
            },
            "text": "Hey",
            "from": {
                "id": 987654321,
                "username": "testuser",
                "first_name": "Test User"
            }
        }
    }
    
    # Send to your local Flask app
    url = "http://localhost:5002/api/telegram/webhook"
    headers = {"Content-Type": "application/json"}
    
    print(f"📤 Sending test message to: {url}")
    print(f"📝 Message: {json.dumps(test_message, indent=2)}")
    
    try:
        response = requests.post(url, json=test_message, headers=headers)
        print(f"✅ Response status: {response.status_code}")
        print(f"📄 Response: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_telegram_webhook()
