#!/usr/bin/env python3
"""
Script to clear Telegram webhook and enable polling
"""
import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN', '8257938180:AAFyNb48pNFNyyUtKZ0vVpPna4THzyA6KW8')

def clear_webhook():
    """Clear any existing webhook to enable polling"""
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/deleteWebhook"
    
    try:
        response = requests.post(url, json={"drop_pending_updates": True})
        print(f"Webhook deletion response: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ Webhook cleared successfully!")
        else:
            print(f"❌ Failed to clear webhook: {response.text}")
            
    except Exception as e:
        print(f"❌ Error clearing webhook: {e}")

if __name__ == "__main__":
    clear_webhook()
