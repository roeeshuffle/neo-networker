import os
import requests
import logging
from typing import Optional, Dict, Any

telegram_logger = logging.getLogger('telegram_service')

class TelegramService:
    def __init__(self):
        self.bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
        
        if not self.bot_token:
            telegram_logger.warning("TELEGRAM_BOT_TOKEN not configured. Telegram sending will be disabled.")
            self.enabled = False
        else:
            self.enabled = True
            
        self.base_url = f"https://api.telegram.org/bot{self.bot_token}"
    
    def send_message(self, chat_id: int, message: str) -> bool:
        """Send a Telegram message to a chat ID"""
        if not self.enabled:
            telegram_logger.info(f"Telegram sending disabled. Would send to {chat_id}: {message}")
            return False
            
        try:
            url = f"{self.base_url}/sendMessage"
            payload = {
                "chat_id": chat_id,
                "text": message,
                "parse_mode": "Markdown"
            }
            
            response = requests.post(url, json=payload, timeout=10)
            
            if response.status_code == 200:
                telegram_logger.info(f"Telegram message sent successfully to {chat_id}")
                return True
            else:
                telegram_logger.error(f"Failed to send Telegram message to {chat_id}: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            telegram_logger.error(f"Error sending Telegram message to {chat_id}: {e}", exc_info=True)
            return False
    
    def process_webhook_message(self, data: Dict[Any, Any]) -> Optional[Dict[str, Any]]:
        """Process incoming Telegram webhook message"""
        try:
            if 'message' not in data:
                return None
                
            message = data['message']
            chat_id = message.get('chat', {}).get('id')
            text = message.get('text', '')
            user_id = message.get('from', {}).get('id')
            
            if not chat_id or not text or not user_id:
                return None
                
            return {
                'chat_id': chat_id,
                'message_text': text,
                'user_id': user_id,
                'platform': 'telegram'
            }
            
        except Exception as e:
            telegram_logger.error(f"Error processing Telegram webhook: {e}", exc_info=True)
            return None

# Global instance
telegram_service = TelegramService()
