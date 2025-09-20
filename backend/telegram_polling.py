#!/usr/bin/env python3
"""
Telegram Bot Polling System
Continuously polls Telegram API for new messages instead of using webhooks
"""
import requests
import time
import json
import logging
from datetime import datetime
from models import TelegramUser, User
from database import db
from app import app
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
telegram_logger = logging.getLogger('telegram_polling')

class TelegramPoller:
    def __init__(self, bot_token):
        self.bot_token = bot_token
        self.api_url = f"https://api.telegram.org/bot{bot_token}"
        self.last_update_id = 0
        
    def get_updates(self):
        """Get new messages from Telegram"""
        try:
            url = f"{self.api_url}/getUpdates"
            params = {
                'offset': self.last_update_id + 1,
                'timeout': 30,  # Long polling
                'allowed_updates': ['message']
            }
            
            telegram_logger.info(f"🔄 Polling for new messages...")
            response = requests.get(url, params=params, timeout=35)
            
            if response.status_code == 200:
                data = response.json()
                if data['ok']:
                    updates = data['result']
                    telegram_logger.info(f"📨 Received {len(updates)} updates")
                    return updates
                else:
                    telegram_logger.error(f"❌ Telegram API error: {data}")
            else:
                telegram_logger.error(f"❌ HTTP error: {response.status_code}")
                
        except Exception as e:
            telegram_logger.error(f"💥 Error getting updates: {e}")
            
        return []
    
    def process_message(self, message):
        """Process a single message (same logic as webhook)"""
        try:
            chat_id = message['chat']['id']
            text = message['text']
            user_id = message['from']['id']
            username = message['from'].get('username', 'Unknown')
            first_name = message['from'].get('first_name', 'Unknown')
            
            # Log incoming message with timestamp
            timestamp = datetime.now().strftime("%H:%M:%S")
            telegram_logger.info(f"[{timestamp}] 📨 New message from {first_name} (@{username}) ID: {user_id}")
            telegram_logger.info(f"[{timestamp}] 💬 Message: '{text}' in chat {chat_id}")
            
            with app.app_context():
                # Get or create telegram user
                telegram_user = TelegramUser.query.filter_by(telegram_id=user_id).first()
                
                if not telegram_user:
                    telegram_logger.info(f"🆕 Creating new Telegram user: {first_name} (@{username}) ID: {user_id}")
                    telegram_user = TelegramUser(
                        id=str(uuid.uuid4()),
                        telegram_id=user_id,
                        telegram_username=username,
                        first_name=first_name,
                        current_state='idle'
                    )
                    db.session.add(telegram_user)
                    db.session.commit()
                    telegram_logger.info(f"✅ New Telegram user created with ID: {telegram_user.id}")
                else:
                    telegram_logger.info(f"👤 Existing Telegram user found: {telegram_user.first_name} (ID: {telegram_user.id})")
                
                # Process the message
                response_text = self.handle_message(text, telegram_user)
                
                # Send response back to user
                self.send_message(chat_id, response_text)
                
        except Exception as e:
            telegram_logger.error(f"💥 Error processing message: {e}")
    
    def handle_message(self, text, telegram_user):
        """Handle different types of messages"""
        telegram_logger.info(f"🔍 Processing command: '{text}' for user {telegram_user.first_name}")
        
        # Handle authentication flow
        if not telegram_user.is_authenticated:
            telegram_logger.info(f"🔐 User {telegram_user.first_name} needs authentication")
            return f"🔐 **Authentication Required**\n\nTo use this bot, you need to connect your Telegram account to your webapp account.\n\n**Your Telegram ID:** `{telegram_user.telegram_id}`\n\n**Steps to connect:**\n1. Go to your webapp: http://localhost:8080\n2. Login to your account\n3. Go to Settings tab\n4. Click 'Connect Telegram'\n5. Enter your Telegram ID: `{telegram_user.telegram_id}`\n\nOnce connected, you can use natural language commands like:\n• 'Add roee'\n• 'Show my tasks'\n• 'Find contacts'\n• 'Add task call John tomorrow'"
        
        # Handle commands only if not in a state
        elif text == '/start':
            telegram_logger.info(f"🚀 User {telegram_user.first_name} started the bot")
            if not telegram_user.is_authenticated:
                return f"🔐 **Welcome to Neo Networker Bot!**\n\nTo use this bot, you need to connect your Telegram account to your webapp account.\n\n**Your Telegram ID:** `{telegram_user.telegram_id}`\n\n**Steps to connect:**\n1. Go to your webapp: http://localhost:8080\n2. Login to your account\n3. Go to Settings tab\n4. Click 'Connect Telegram'\n5. Enter your Telegram ID: `{telegram_user.telegram_id}`\n\nOnce connected, you can use natural language commands like:\n• 'Add roee'\n• 'Show my tasks'\n• 'Find contacts'\n• 'Add task call John tomorrow'"
            else:
                return f"👋 Welcome back {telegram_user.first_name}!\n\nYou can use natural language commands like:\n• 'Add roee'\n• 'Show my tasks'\n• 'Find contacts'"
        
        elif text == '/auth':
            telegram_logger.info(f"🔐 User {telegram_user.first_name} initiated authentication")
            if telegram_user.user_id:
                # User is already connected to a webapp account
                telegram_user.is_authenticated = True
                telegram_user.authenticated_at = datetime.utcnow()
                telegram_user.current_state = 'idle'
                db.session.commit()
                return "✅ You are already connected to your webapp account! You can now use the bot."
            else:
                # User needs to authenticate with password first
                telegram_user.current_state = 'waiting_password'
                db.session.commit()
                return "🔐 Please enter the password to authenticate:\n\nPassword: 121212"
        
        elif text == '/help':
            telegram_logger.info(f"❓ User {telegram_user.first_name} requested help")
            return """Available commands:
/start - Start the bot
/help - Show this help message
/auth - Authenticate (requires webapp connection)
/status - Check your status

To use this bot, you need to connect your Telegram account via the webapp first."""
        
        elif text == '/status':
            auth_status = 'Authenticated' if telegram_user.is_authenticated else 'Not authenticated'
            telegram_logger.info(f"📊 User {telegram_user.first_name} checked status: {auth_status}")
            return f"Status: {auth_status}"
        
        else:
            # Handle state-based responses first
            if telegram_user.current_state == 'waiting_password':
                # User is trying to authenticate with password
                if text == '121212':
                    telegram_logger.info(f"✅ User {telegram_user.first_name} authenticated with correct password")
                    telegram_user.is_authenticated = True
                    telegram_user.authenticated_at = datetime.utcnow()
                    telegram_user.current_state = 'idle'
                    db.session.commit()
                    return f"✅ Authentication successful! Your Telegram ID is: {telegram_user.telegram_id}\n\nNow connect this ID in your webapp:\n1. Go to Settings tab\n2. Enter your Telegram ID: {telegram_user.telegram_id}\n3. Click Connect Telegram\n\nAfter connecting, you can use the bot to manage your data!"
                else:
                    telegram_logger.info(f"❌ User {telegram_user.first_name} entered wrong password: '{text}'")
                    return "❌ Wrong password. Please try again or use /auth to restart."
            
            elif telegram_user.current_state == 'waiting_delete_confirmation':
                # User is selecting which contact to delete
                try:
                    from models import Person
                    selection = int(text.strip())
                    if telegram_user.state_data and 'search_term' in telegram_user.state_data:
                        search_term = telegram_user.state_data['search_term']
                        people = Person.query.filter(Person.full_name.ilike(f'%{search_term}%')).limit(10).all()
                        
                        if 1 <= selection <= len(people):
                            person = people[selection - 1]
                            person_name = person.full_name
                            db.session.delete(person)
                            db.session.commit()
                            
                            # Reset state
                            telegram_user.current_state = 'idle'
                            telegram_user.state_data = None
                            db.session.commit()
                            
                            return f"✅ {person_name} deleted successfully."
                        else:
                            return f"❌ Invalid selection. Please choose a number between 1 and {len(people)}."
                    else:
                        return "❌ Error: No delete operation in progress. Please start over."
                except ValueError:
                    return "❌ Please enter a valid number to select the contact to delete."
                except Exception as e:
                    return f"❌ Error deleting contact: {str(e)}"
            
            # Use OpenAI to process natural language requests
            elif telegram_user.is_authenticated and telegram_user.user_id:
                telegram_logger.info(f"🤖 Processing natural language request for user {telegram_user.first_name}: '{text}'")
                # Import the function from the webhook handler
                from routes.telegram import process_natural_language_request, send_admin_notification
                response_text = process_natural_language_request(text, telegram_user)
                telegram_logger.info(f"🤖 OpenAI response for user {telegram_user.first_name}: '{response_text[:100]}...'")
                
                # Send admin notification
                success = not response_text.startswith("❌")
                send_admin_notification(
                    user_id=f"{telegram_user.first_name} ({telegram_user.telegram_id})",
                    prompt=text,
                    response=response_text[:100] + "..." if len(response_text) > 100 else response_text,
                    success=success
                )
                
                return response_text
            else:
                telegram_logger.info(f"🚫 Unauthenticated user {telegram_user.first_name} tried to use bot: '{text}'")
                return "🔐 Please authenticate first. Send /start to begin authentication."
    
    def send_message(self, chat_id, text):
        """Send a message back to the user"""
        try:
            url = f"{self.api_url}/sendMessage"
            data = {
                'chat_id': chat_id,
                'text': text,
                'parse_mode': 'HTML'
            }
            
            telegram_logger.info(f"📤 Sending response to chat {chat_id}: '{text[:100]}...'")
            response = requests.post(url, json=data)
            
            if response.status_code == 200:
                telegram_logger.info(f"✅ Message sent successfully")
            else:
                telegram_logger.error(f"❌ Failed to send message: {response.status_code} - {response.text}")
                
        except Exception as e:
            telegram_logger.error(f"💥 Error sending message: {e}")
    
    def start_polling(self):
        """Start the polling loop"""
        telegram_logger.info(f"🚀 Starting Telegram polling for bot: {self.bot_token[:10]}...")
        
        while True:
            try:
                updates = self.get_updates()
                
                for update in updates:
                    self.last_update_id = update['update_id']
                    
                    if 'message' in update:
                        self.process_message(update['message'])
                
                # Small delay to prevent overwhelming the API
                time.sleep(1)
                
            except KeyboardInterrupt:
                telegram_logger.info("🛑 Polling stopped by user")
                break
            except Exception as e:
                telegram_logger.error(f"💥 Polling error: {e}")
                time.sleep(5)  # Wait before retrying

def main():
    """Main function to start polling"""
    import os
    import psutil
    from dotenv import load_dotenv
    
    load_dotenv()
    
    # Check if another instance is already running
    current_process = psutil.Process()
    for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
        try:
            if (proc.info['name'] == 'Python' and 
                proc.info['cmdline'] and 
                'telegram_polling.py' in ' '.join(proc.info['cmdline']) and 
                proc.info['pid'] != current_process.pid):
                print(f"❌ Another Telegram bot instance is already running (PID: {proc.info['pid']})")
                print("🛑 Please stop the existing instance first")
                return
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue
    
    bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
    if not bot_token:
        print("❌ TELEGRAM_BOT_TOKEN not found in environment variables")
        return
    
    print(f"🤖 Starting Telegram Bot Polling...")
    print(f"🔑 Bot Token: {bot_token[:10]}...")
    print(f"📱 Send messages to your bot and watch the logs!")
    print(f"🛑 Press Ctrl+C to stop")
    print("=" * 50)
    
    poller = TelegramPoller(bot_token)
    poller.start_polling()

if __name__ == "__main__":
    main()
