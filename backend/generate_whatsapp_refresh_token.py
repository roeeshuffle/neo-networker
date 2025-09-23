#!/usr/bin/env python3
"""
WhatsApp Business API - Generate Long-lived Refresh Token

This script helps you generate a long-lived refresh token for WhatsApp Business API
that can be used to automatically refresh access tokens.

Prerequisites:
1. WhatsApp Business Account
2. Meta Developer Account
3. WhatsApp Business API App
4. Short-lived access token (from Meta Developer Console)

Usage:
1. Get a short-lived access token from Meta Developer Console
2. Run this script with your app credentials
3. Use the generated refresh token in your environment variables
"""

import requests
import json
import os
from typing import Optional

def generate_long_lived_token(short_lived_token: str, app_id: str, app_secret: str) -> Optional[dict]:
    """
    Generate a long-lived access token from a short-lived one
    
    Args:
        short_lived_token: Short-lived access token from Meta Developer Console
        app_id: Your WhatsApp Business API App ID
        app_secret: Your WhatsApp Business API App Secret
    
    Returns:
        Dictionary with long_lived_token and expires_in, or None if failed
    """
    
    url = "https://graph.facebook.com/v18.0/oauth/access_token"
    
    params = {
        'grant_type': 'fb_exchange_token',
        'client_id': app_id,
        'client_secret': app_secret,
        'fb_exchange_token': short_lived_token
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            return {
                'long_lived_token': data.get('access_token'),
                'expires_in': data.get('expires_in'),
                'token_type': data.get('token_type', 'bearer')
            }
        else:
            print(f"❌ Error generating long-lived token: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Exception occurred: {e}")
        return None

def get_app_info(access_token: str) -> Optional[dict]:
    """Get app information using access token"""
    url = f"https://graph.facebook.com/v18.0/me"
    params = {'access_token': access_token}
    
    try:
        response = requests.get(url, params=params, timeout=10)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ Error getting app info: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Exception getting app info: {e}")
        return None

def main():
    print("🔧 WhatsApp Business API - Long-lived Token Generator")
    print("=" * 60)
    
    # Get credentials from user
    print("\n📋 Please provide your WhatsApp Business API credentials:")
    print("(You can find these in Meta Developer Console)")
    
    app_id = input("App ID: ").strip()
    app_secret = input("App Secret: ").strip()
    short_lived_token = input("Short-lived Access Token: ").strip()
    
    if not all([app_id, app_secret, short_lived_token]):
        print("❌ All fields are required!")
        return
    
    print("\n🔄 Generating long-lived token...")
    
    # Generate long-lived token
    result = generate_long_lived_token(short_lived_token, app_id, app_secret)
    
    if result:
        print("\n✅ Long-lived token generated successfully!")
        print("=" * 60)
        print(f"Long-lived Token: {result['long_lived_token']}")
        print(f"Expires In: {result['expires_in']} seconds ({result['expires_in'] // 3600} hours)")
        print(f"Token Type: {result['token_type']}")
        
        print("\n🔧 Environment Variables to Add:")
        print("=" * 60)
        print(f"WHATSAPP_APP_ID={app_id}")
        print(f"WHATSAPP_APP_SECRET={app_secret}")
        print(f"WHATSAPP_REFRESH_TOKEN={result['long_lived_token']}")
        
        print("\n📝 Instructions:")
        print("1. Add these environment variables to your AWS App Runner service")
        print("2. The refresh token will be used to automatically generate new access tokens")
        print("3. Long-lived tokens typically last 60 days")
        print("4. The system will automatically refresh tokens before they expire")
        
        # Save to file for reference
        config = {
            'app_id': app_id,
            'app_secret': app_secret,
            'refresh_token': result['long_lived_token'],
            'expires_in': result['expires_in'],
            'generated_at': '2025-09-23'
        }
        
        with open('whatsapp_config.json', 'w') as f:
            json.dump(config, f, indent=2)
        
        print(f"\n💾 Configuration saved to: whatsapp_config.json")
        
    else:
        print("\n❌ Failed to generate long-lived token!")
        print("\n🔍 Troubleshooting:")
        print("1. Verify your App ID and App Secret are correct")
        print("2. Ensure your short-lived token is valid and not expired")
        print("3. Check that your app has the necessary permissions")
        print("4. Make sure you're using the correct WhatsApp Business API app")

if __name__ == "__main__":
    main()
