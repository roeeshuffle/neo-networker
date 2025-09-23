import os
import requests
import logging
import time
from typing import Optional
from datetime import datetime, timedelta

whatsapp_logger = logging.getLogger('whatsapp_service')

class WhatsAppService:
    def __init__(self):
        self.business_account_id = os.getenv('WHATSAPP_BUSINESS_ACCOUNT_ID')
        self.phone_number_id = os.getenv('WHATSAPP_PHONE_NUMBER_ID')
        self.access_token = os.getenv('WHATSAPP_ACCESS_TOKEN')
        self.webhook_verify_token = os.getenv('WHATSAPP_WEBHOOK_VERIFY_TOKEN')
        self.app_secret = os.getenv('WHATSAPP_APP_SECRET')
        
        # Token refresh mechanism
        self.token_expires_at = None
        self.refresh_token = os.getenv('WHATSAPP_REFRESH_TOKEN')  # Long-lived refresh token
        self.app_id = os.getenv('WHATSAPP_APP_ID')
        
        if not all([self.business_account_id, self.phone_number_id, self.access_token]):
            whatsapp_logger.warning("WhatsApp environment variables not fully configured. WhatsApp sending will be disabled.")
            self.enabled = False
        else:
            self.enabled = True
            # Set initial token expiry (assume 1 hour from now)
            self.token_expires_at = datetime.now() + timedelta(hours=1)
            
        self.base_url = f"https://graph.facebook.com/v22.0/{self.phone_number_id}/messages"
    
    def refresh_access_token(self) -> bool:
        """Refresh the WhatsApp access token using refresh token"""
        if not self.refresh_token or not self.app_id:
            whatsapp_logger.warning("Refresh token or App ID not configured. Cannot refresh token automatically.")
            return False
            
        try:
            url = "https://graph.facebook.com/v22.0/oauth/access_token"
            params = {
                'grant_type': 'fb_exchange_token',
                'client_id': self.app_id,
                'client_secret': self.app_secret,
                'fb_exchange_token': self.refresh_token
            }
            
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                new_token = data.get('access_token')
                expires_in = data.get('expires_in', 3600)  # Default to 1 hour
                
                if new_token:
                    self.access_token = new_token
                    self.token_expires_at = datetime.now() + timedelta(seconds=expires_in)
                    whatsapp_logger.info(f"WhatsApp access token refreshed successfully. Expires at: {self.token_expires_at}")
                    return True
                else:
                    whatsapp_logger.error("No access token in refresh response")
                    return False
            else:
                whatsapp_logger.error(f"Failed to refresh WhatsApp token: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            whatsapp_logger.error(f"Error refreshing WhatsApp token: {e}", exc_info=True)
            return False
    
    def ensure_valid_token(self) -> bool:
        """Ensure we have a valid access token, refresh if needed"""
        if not self.enabled:
            return False
            
        # Check if token is expired or will expire in the next 5 minutes
        if self.token_expires_at and datetime.now() + timedelta(minutes=5) >= self.token_expires_at:
            whatsapp_logger.info("WhatsApp token is expired or expiring soon, refreshing...")
            return self.refresh_access_token()
        
        return True
    
    def send_message(self, to_phone: str, message: str) -> bool:
        """Send a WhatsApp message to a phone number"""
        if not self.enabled:
            whatsapp_logger.info(f"WhatsApp sending disabled. Would send to {to_phone}: {message}")
            return False
        
        # Ensure we have a valid token before sending
        if not self.ensure_valid_token():
            whatsapp_logger.error("Failed to ensure valid WhatsApp token")
            return False
            
        try:
            # Format phone number (remove + and spaces/dashes, but don't add country code)
            formatted_phone = to_phone.replace('+', '').replace(' ', '').replace('-', '')
            # Don't add country code - use the phone number as provided
                
            payload = {
                "messaging_product": "whatsapp",
                "to": formatted_phone,
                "type": "text",
                "text": {
                    "body": message
                }
            }
            
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json"
            }
            
            response = requests.post(self.base_url, json=payload, headers=headers, timeout=10)
            
            if response.status_code == 200:
                whatsapp_logger.info(f"WhatsApp message sent successfully to {to_phone}")
                return True
            elif response.status_code == 401:
                # Token expired, try to refresh and retry once
                whatsapp_logger.warning(f"WhatsApp token expired, attempting refresh and retry for {to_phone}")
                if self.refresh_access_token():
                    headers["Authorization"] = f"Bearer {self.access_token}"
                    retry_response = requests.post(self.base_url, json=payload, headers=headers, timeout=10)
                    if retry_response.status_code == 200:
                        whatsapp_logger.info(f"WhatsApp message sent successfully to {to_phone} after token refresh")
                        return True
                    else:
                        whatsapp_logger.error(f"Failed to send WhatsApp message to {to_phone} after token refresh: {retry_response.status_code} - {retry_response.text}")
                        return False
                else:
                    whatsapp_logger.error(f"Failed to refresh WhatsApp token for {to_phone}")
                    return False
            else:
                whatsapp_logger.error(f"Failed to send WhatsApp message to {to_phone}: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            whatsapp_logger.error(f"Error sending WhatsApp message to {to_phone}: {e}", exc_info=True)
            return False
    
    def verify_webhook(self, verify_token: str) -> bool:
        """Verify WhatsApp webhook token"""
        return verify_token == self.webhook_verify_token
    
    def process_webhook_message(self, data: dict) -> Optional[dict]:
        """Process incoming WhatsApp webhook message"""
        try:
            if 'entry' not in data or not data['entry']:
                return None
                
            entry = data['entry'][0]
            if 'changes' not in entry or not entry['changes']:
                return None
                
            change = entry['changes'][0]
            if change.get('field') != 'messages':
                return None
                
            value = change.get('value', {})
            if 'messages' not in value or not value['messages']:
                return None
                
            message = value['messages'][0]
            
            # Extract message data
            from_phone = message.get('from')
            message_id = message.get('id')
            
            # Check for text message
            if 'text' in message:
                message_text = message.get('text', {}).get('body', '')
                message_type = 'text'
                return {
                    'from_phone': from_phone,
                    'message_text': message_text,
                    'message_id': message_id,
                    'message_type': message_type,
                    'platform': 'whatsapp'
                }
            
            # Check for voice/audio message
            elif 'audio' in message:
                audio = message.get('audio', {})
                audio_id = audio.get('id')
                message_type = 'audio'
                return {
                    'from_phone': from_phone,
                    'message_text': '',  # No text for voice messages
                    'message_id': message_id,
                    'message_type': message_type,
                    'audio_id': audio_id,
                    'platform': 'whatsapp'
                }
            
            # Check for voice message (alternative format)
            elif 'voice' in message:
                voice = message.get('voice', {})
                audio_id = voice.get('id')
                message_type = 'audio'
                return {
                    'from_phone': from_phone,
                    'message_text': '',  # No text for voice messages
                    'message_id': message_id,
                    'message_type': message_type,
                    'audio_id': audio_id,
                    'platform': 'whatsapp'
                }
            
            # Unknown message type
            else:
                whatsapp_logger.info(f"Unknown message type from {from_phone}: {message.keys()}")
                return None
            
        except Exception as e:
            whatsapp_logger.error(f"Error processing WhatsApp webhook: {e}", exc_info=True)
            return None

# Global instance
whatsapp_service = WhatsAppService()
