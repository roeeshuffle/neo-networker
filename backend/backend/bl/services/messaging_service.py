import logging
from typing import Optional, Dict, Any
from dal.models import User
from bl.services.telegram_service import telegram_service
from bl.services.whatsapp_service import whatsapp_service

messaging_logger = logging.getLogger('messaging_service')

class MessagingService:
    def __init__(self):
        self.telegram = telegram_service
        self.whatsapp = whatsapp_service
    
    def send_message(self, user: User, message: str) -> bool:
        """Send message to user based on their preferred platform"""
        try:
            if not user.is_approved:
                messaging_logger.warning(f"User {user.email} is not approved, cannot send message")
                return False
                
            platform = user.preferred_messaging_platform or 'telegram'
            
            if platform == 'telegram' and user.telegram_id:
                messaging_logger.info(f"Sending Telegram message to user {user.email}")
                return self.telegram.send_message(user.telegram_id, message)
                
            elif platform == 'whatsapp' and user.whatsapp_phone:
                messaging_logger.info(f"Sending WhatsApp message to user {user.email}")
                return self.whatsapp.send_message(user.whatsapp_phone, message)
                
            else:
                messaging_logger.warning(f"User {user.email} has no {platform} connection configured")
                return False
                
        except Exception as e:
            messaging_logger.error(f"Error sending message to user {user.email}: {e}", exc_info=True)
            return False
    
    def send_message_to_phone(self, phone: str, message: str, platform: str = 'whatsapp') -> bool:
        """Send message directly to a phone number"""
        try:
            if platform == 'whatsapp':
                return self.whatsapp.send_message(phone, message)
            else:
                messaging_logger.error(f"Unsupported platform for phone messaging: {platform}")
                return False
                
        except Exception as e:
            messaging_logger.error(f"Error sending message to phone {phone}: {e}", exc_info=True)
            return False
    
    def send_message_to_telegram_id(self, telegram_id: int, message: str) -> bool:
        """Send message directly to a Telegram ID"""
        try:
            return self.telegram.send_message(telegram_id, message)
        except Exception as e:
            messaging_logger.error(f"Error sending message to Telegram ID {telegram_id}: {e}", exc_info=True)
            return False
    
    def process_incoming_message(self, platform: str, data: Dict[Any, Any]) -> Optional[Dict[str, Any]]:
        """Process incoming message from any platform"""
        try:
            if platform == 'telegram':
                return self.telegram.process_webhook_message(data)
            elif platform == 'whatsapp':
                return self.whatsapp.process_webhook_message(data)
            else:
                messaging_logger.error(f"Unsupported platform: {platform}")
                return None
                
        except Exception as e:
            messaging_logger.error(f"Error processing incoming message from {platform}: {e}", exc_info=True)
            return None

# Global instance
messaging_service = MessagingService()
