import os
import requests
import logging
from typing import Optional

whatsapp_logger = logging.getLogger('whatsapp_service')

class WhatsAppService:
    def __init__(self):
        self.business_account_id = os.getenv('WHATSAPP_BUSINESS_ACCOUNT_ID')
        self.phone_number_id = os.getenv('WHATSAPP_PHONE_NUMBER_ID')
        self.access_token = os.getenv('WHATSAPP_ACCESS_TOKEN')
        self.webhook_verify_token = os.getenv('WHATSAPP_WEBHOOK_VERIFY_TOKEN')
        self.app_secret = os.getenv('WHATSAPP_APP_SECRET')
        
        if not all([self.business_account_id, self.phone_number_id, self.access_token]):
            whatsapp_logger.warning("WhatsApp environment variables not fully configured. WhatsApp sending will be disabled.")
            self.enabled = False
        else:
            self.enabled = True
            
        self.base_url = f"https://graph.facebook.com/v18.0/{self.phone_number_id}/messages"
    
    def send_message(self, to_phone: str, message: str) -> bool:
        """Send a WhatsApp message to a phone number"""
        if not self.enabled:
            whatsapp_logger.info(f"WhatsApp sending disabled. Would send to {to_phone}: {message}")
            return False
            
        try:
            # Format phone number (remove + and ensure it starts with country code)
            formatted_phone = to_phone.replace('+', '').replace(' ', '').replace('-', '')
            if not formatted_phone.startswith('1'):  # Assuming US numbers, adjust as needed
                formatted_phone = '1' + formatted_phone
                
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
