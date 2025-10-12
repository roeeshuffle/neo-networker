import logging
from typing import Optional

logger = logging.getLogger('formatting_service')

class MessageFormatter:
    """Handle message formatting for different messaging platforms"""
    
    @staticmethod
    def format_for_platform(message: str, platform: str) -> str:
        """Format message for specific platform"""
        if platform == 'telegram':
            return MessageFormatter.format_for_telegram(message)
        elif platform == 'whatsapp':
            return MessageFormatter.format_for_whatsapp(message)
        else:
            # Default to plain text
            return MessageFormatter.strip_formatting(message)
    
    @staticmethod
    def format_for_telegram(message: str) -> str:
        """Format message for Telegram (Markdown)"""
        # Convert HTML bold to Markdown bold
        formatted = message.replace('<b>', '**').replace('</b>', '**')
        formatted = formatted.replace('<strong>', '**').replace('</strong>', '**')
        
        # Convert HTML italic to Markdown italic
        formatted = formatted.replace('<i>', '*').replace('</i>', '*')
        formatted = formatted.replace('<em>', '*').replace('</em>', '*')
        
        # Convert HTML code to Markdown code
        formatted = formatted.replace('<code>', '`').replace('</code>', '`')
        
        # Convert HTML pre to Markdown pre
        formatted = formatted.replace('<pre>', '```').replace('</pre>', '```')
        
        return formatted
    
    @staticmethod
    def format_for_whatsapp(message: str) -> str:
        """Format message for WhatsApp (limited formatting)"""
        # WhatsApp supports basic formatting:
        # *bold* for bold
        # _italic_ for italic
        # ~strikethrough~ for strikethrough
        # ```code``` for monospace
        
        # Convert HTML bold to WhatsApp bold
        formatted = message.replace('<b>', '*').replace('</b>', '*')
        formatted = formatted.replace('<strong>', '*').replace('</strong>', '*')
        
        # Convert HTML italic to WhatsApp italic
        formatted = formatted.replace('<i>', '_').replace('</i>', '_')
        formatted = formatted.replace('<em>', '_').replace('</em>', '_')
        
        # Convert HTML code to WhatsApp monospace
        formatted = formatted.replace('<code>', '```').replace('</code>', '```')
        
        # Convert HTML pre to WhatsApp monospace
        formatted = formatted.replace('<pre>', '```').replace('</pre>', '```')
        
        return formatted
    
    @staticmethod
    def strip_formatting(message: str) -> str:
        """Remove all HTML formatting for plain text"""
        import re
        
        # Remove HTML tags
        formatted = re.sub(r'<[^>]+>', '', message)
        
        return formatted
    
    @staticmethod
    def bold(text: str, platform: str = 'telegram') -> str:
        """Make text bold for specific platform"""
        if platform == 'telegram':
            return f"**{text}**"
        elif platform == 'whatsapp':
            return f"*{text}*"
        else:
            return text
    
    @staticmethod
    def italic(text: str, platform: str = 'telegram') -> str:
        """Make text italic for specific platform"""
        if platform == 'telegram':
            return f"*{text}*"
        elif platform == 'whatsapp':
            return f"_{text}_"
        else:
            return text
    
    @staticmethod
    def code(text: str, platform: str = 'telegram') -> str:
        """Make text monospace for specific platform"""
        if platform in ['telegram', 'whatsapp']:
            return f"`{text}`"
        else:
            return text

# Global instance
message_formatter = MessageFormatter()
