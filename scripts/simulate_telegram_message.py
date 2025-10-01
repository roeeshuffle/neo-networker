#!/usr/bin/env python3
"""
Simulate a Telegram message locally without needing internet
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app
from routes.telegram import telegram_webhook
import json

def simulate_telegram_message():
    """Simulate your 'Hey' message locally"""
    
    # Create a test request context
    with app.test_request_context(
        '/api/telegram/webhook',
        method='POST',
        json={
            "message": {
                "chat": {"id": 123456789},
                "text": "Hey",
                "from": {
                    "id": 987654321,
                    "username": "testuser",
                    "first_name": "Test User"
                }
            }
        }
    ):
        print("🚀 Simulating Telegram message: 'Hey'")
        print("📝 This will trigger all the logging we set up!")
        print("=" * 50)
        
        # Call the webhook function directly
        response = telegram_webhook()
        
        print("=" * 50)
        print(f"✅ Response: {response}")
        
        # Check the logs
        print("\n📋 Check the logs above to see all the detailed logging!")

if __name__ == "__main__":
    simulate_telegram_message()
