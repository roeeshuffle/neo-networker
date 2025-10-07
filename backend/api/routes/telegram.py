from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from dal.models import User, Person, Task, Event
from dal.database import db
from datetime import datetime, timedelta
import uuid
import requests
import os
import openai
import json
import logging

# Configure logging for Telegram bot
logging.basicConfig(level=logging.INFO)
telegram_logger = logging.getLogger('telegram_bot')

telegram_bp = Blueprint('telegram', __name__)

# Initialize OpenAI
openai.api_key = os.getenv('OPENAI_API_KEY')

# Admin user ID for notifications
ADMIN_TELEGRAM_ID = 1001816902

def answer_callback_query(callback_query_id, text):
    """Answer a callback query"""
    try:
        bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
        if not bot_token:
            return
            
        url = f"https://api.telegram.org/bot{bot_token}/answerCallbackQuery"
        data = {
            'callback_query_id': callback_query_id,
            'text': text,
            'show_alert': False
        }
        requests.post(url, json=data, timeout=5)
    except Exception as e:
        telegram_logger.error(f"❌ Error answering callback query: {e}")

def delete_telegram_message(chat_id, message_id):
    """Delete a message from Telegram"""
    try:
        bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
        if not bot_token:
            return
            
        url = f"https://api.telegram.org/bot{bot_token}/deleteMessage"
        data = {
            'chat_id': chat_id,
            'message_id': message_id
        }
        response = requests.post(url, json=data, timeout=5)
        if response.status_code == 200:
            telegram_logger.info(f"✅ Message {message_id} deleted from chat {chat_id}")
        else:
            telegram_logger.error(f"❌ Failed to delete message: {response.status_code}")
    except Exception as e:
        telegram_logger.error(f"❌ Error deleting message: {e}")

def handle_callback_query(callback_query):
    """Handle callback queries from inline keyboards"""
    try:
        data = callback_query.get('data', '')
        chat_id = callback_query['message']['chat']['id']
        user_id = callback_query['from']['id']
        first_name = callback_query['from'].get('first_name', 'Unknown')
        
        telegram_logger.info(f"🔘 Callback query from {first_name}: {data}")
        
        # Handle voice approval
        if data == 'voice_approve':
            telegram_logger.info(f"✅ Voice approved by {first_name}")
            
            # Find the user by telegram_id
            user = User.query.filter_by(telegram_id=user_id).first()
            if not user:
                telegram_logger.error(f"❌ User not found: {user_id}")
                send_telegram_message(chat_id, "❌ User not found. Please connect your Telegram account via the web app first.")
                return jsonify({'status': 'ok'})
            
            # Get the transcription from the user's state data
            if user.state_data and 'transcription' in user.state_data:
                transcription = user.state_data['transcription']
                telegram_logger.info(f"✅ Processing approved transcription: '{transcription}'")
                
                response_text = process_natural_language_request(transcription, user)
                send_telegram_message(chat_id, response_text)
                
                # Clear the state data
                user.state_data = None
                if not user.state_data:
                    user.state_data = {}
                user.state_data['current_state'] = None
                db.session.commit()
            else:
                telegram_logger.error(f"❌ No pending transcription found for user {user_id}")
                send_telegram_message(chat_id, "❌ No voice message to process.")
            
            # Delete the approval message
            delete_telegram_message(chat_id, callback_query['message']['message_id'])
            
            # Answer the callback query
            answer_callback_query(callback_query['id'], "Voice approved!")
            return jsonify({'status': 'ok'})
            
        elif data == 'voice_reject':
            telegram_logger.info(f"❌ Voice rejected by {first_name}")
            
            # Clear any pending state data
            user = User.query.filter_by(telegram_id=user_id).first()
            if user:
                user.state_data = None
                if not user.state_data:
                    user.state_data = {}
                user.state_data['current_state'] = None
                db.session.commit()
            
            # Delete the approval message (no response message needed)
            delete_telegram_message(chat_id, callback_query['message']['message_id'])
            
            # Answer the callback query
            answer_callback_query(callback_query['id'], "Voice rejected!")
            return jsonify({'status': 'ok'})
        
        # Answer unknown callback queries
        answer_callback_query(callback_query['id'], "Unknown action")
        return jsonify({'status': 'ok'})
        
    except Exception as e:
        telegram_logger.error(f"💥 Error handling callback query: {str(e)}")
        return jsonify({'error': str(e)}), 500

def handle_voice_message(message, chat_id, user_id, first_name, username):
    """Handle voice message from Telegram"""
    try:
        voice = message['voice']
        file_id = voice['file_id']
        
        telegram_logger.info(f"🎤 Processing voice message from {first_name} (file_id: {file_id})")
        
        # Get or create user
        user = User.query.filter_by(telegram_id=user_id).first()
        
        if not user:
            telegram_logger.info(f"🆕 Creating new user for voice: {first_name} ID: {user_id}")
            user = User(
                id=str(uuid.uuid4()),
                telegram_id=user_id,
                telegram_username=username,
                full_name=first_name,
                email=f"{username}@telegram.local",  # Temporary email
                is_approved=True  # Auto-approve telegram users
            )
            db.session.add(user)
            db.session.commit()
        
        # Check if user's Telegram ID is connected in the web app
        webapp_user = User.query.filter_by(telegram_id=user.telegram_id).first()
        
        if not webapp_user:
            response_text = f"🔐 **Connection Required**\n\nTo use voice commands, you need to connect your Telegram account to your webapp account.\n\n**Your Telegram ID:** `{user.telegram_id}`\n\n**Steps to connect:**\n1. Go to your webapp: https://d2fq8k5py78ii.cloudfront.net/\n2. Login to your account\n3. Go to Settings tab\n4. Enter your Telegram ID: `{user.telegram_id}`\n5. Click 'Connect Telegram'"
        else:
            # Convert voice to text using OpenAI Whisper
            transcription = convert_voice_to_text(file_id)
            
            if transcription:
                # Set state to waiting for voice approval
                if not user.state_data:
                    user.state_data = {}
                user.state_data['current_state'] = 'waiting_voice_approval'
                user.state_data = {'transcription': transcription}
                db.session.commit()
                
                # Send approval request with inline keyboard
                response_text = f"🎤 {transcription}"
                
                # Send message with inline keyboard
                send_voice_approval_keyboard(chat_id, response_text, transcription)
                return jsonify({'status': 'ok', 'response': 'Voice approval sent'})
            else:
                response_text = "❌ Sorry, I couldn't process your voice message. Please try again or send a text message."
        
        # Send response
        send_telegram_message(chat_id, response_text)
        return jsonify({'status': 'ok', 'response': response_text})
        
    except Exception as e:
        telegram_logger.error(f"💥 Error processing voice message from {first_name}: {str(e)}")
        send_telegram_message(chat_id, "❌ Sorry, there was an error processing your voice message.")
        return jsonify({'error': str(e)}), 500

def convert_voice_to_text(file_id):
    """Convert Telegram voice message to text using OpenAI Whisper"""
    try:
        # Get file path from Telegram
        bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
        if not bot_token:
            telegram_logger.error("❌ Telegram bot token not configured")
            return None
            
        # Get file info
        file_url = f"https://api.telegram.org/bot{bot_token}/getFile?file_id={file_id}"
        file_response = requests.get(file_url, timeout=10)
        
        if file_response.status_code != 200:
            telegram_logger.error(f"❌ Failed to get file info: {file_response.status_code}")
            return None
            
        file_info = file_response.json()
        if not file_info.get('ok'):
            telegram_logger.error(f"❌ File info error: {file_info}")
            return None
            
        file_path = file_info['result']['file_path']
        file_url = f"https://api.telegram.org/file/bot{bot_token}/{file_path}"
        
        # Download the voice file
        voice_response = requests.get(file_url, timeout=30)
        if voice_response.status_code != 200:
            telegram_logger.error(f"❌ Failed to download voice file: {voice_response.status_code}")
            return None
            
        # Convert to text using OpenAI Whisper
        openai.api_key = os.getenv('OPENAI_API_KEY')
        if not openai.api_key:
            telegram_logger.error("❌ OpenAI API key not configured")
            return None
            
        # Create a temporary file for the audio
        import tempfile
        with tempfile.NamedTemporaryFile(suffix='.ogg', delete=False) as temp_file:
            temp_file.write(voice_response.content)
            temp_file_path = temp_file.name
            
        try:
            # Transcribe using OpenAI Whisper (force English)
            with open(temp_file_path, 'rb') as audio_file:
                client = openai.OpenAI(
                    api_key=openai.api_key,
                    default_headers={"OpenAI-Beta": "assistants=v2"}
                )
                transcription = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language="en",  # Force English transcription
                    prompt="This is a business task management voice command. Please transcribe in English only."  # Additional prompt to force English
                )
                
            transcription_text = transcription.text.strip()
            telegram_logger.info(f"🎤 Voice transcribed: '{transcription_text}'")
            return transcription_text
            
        finally:
            # Clean up temporary file
            import os as os_module
            try:
                os_module.unlink(temp_file_path)
            except:
                pass
                
    except Exception as e:
        telegram_logger.error(f"💥 Error converting voice to text: {str(e)}")
        return None

def send_voice_approval_keyboard(chat_id, text, transcription):
    """Send message with inline keyboard for voice approval"""
    try:
        bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
        if not bot_token:
            return
            
        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        
        # Create inline keyboard with shorter callback data
        # Use a simple ID instead of the full transcription to avoid 64-byte limit
        keyboard = {
            "inline_keyboard": [
                [
                    {"text": "✅", "callback_data": "voice_approve"},
                    {"text": "❌", "callback_data": "voice_reject"}
                ]
            ]
        }
        
        data = {
            'chat_id': chat_id,
            'text': text,
            'reply_markup': json.dumps(keyboard)
        }
        
        response = requests.post(url, data=data, timeout=10)
        if response.status_code == 200:
            telegram_logger.info(f"✅ Voice approval keyboard sent to chat {chat_id}")
        else:
            telegram_logger.error(f"❌ Failed to send voice approval keyboard: {response.status_code}")
            # Log the response for debugging
            try:
                error_details = response.json()
                telegram_logger.error(f"❌ Error details: {error_details}")
            except:
                telegram_logger.error(f"❌ Raw response: {response.text}")
            
    except Exception as e:
        telegram_logger.error(f"💥 Error sending voice approval keyboard: {str(e)}")

def send_telegram_message(chat_id, text):
    """Send a text message to Telegram"""
    try:
        bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
        if not bot_token:
            return
            
        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        data = {
            'chat_id': chat_id,
            'text': text,
            'parse_mode': 'HTML'
        }
        
        response = requests.post(url, data=data, timeout=10)
        if response.status_code == 200:
            telegram_logger.info(f"✅ Message sent to chat {chat_id}")
        else:
            telegram_logger.error(f"❌ Failed to send message: {response.status_code}")
            
    except Exception as e:
        telegram_logger.error(f"💥 Error sending message: {str(e)}")

def send_admin_notification(user_id: str, prompt: str, response: str, success: bool):
    """Send notification to admin about user requests"""
    try:
        bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
        if not bot_token:
            telegram_logger.warning("⚠️ Telegram bot token not configured for admin notifications")
            return
        
        # Format the message
        status = "✅ Succeeded" if success else "❌ Failed"
        message = f"User: {user_id}\nRequest: {prompt}\nResponse: {status}"
        
        # Send message to admin
        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        data = {
            'chat_id': ADMIN_TELEGRAM_ID,
            'text': message,
            'parse_mode': 'HTML'
        }
        
        response = requests.post(url, data=data, timeout=5)
        if response.status_code == 200:
            telegram_logger.info(f"📤 Admin notification sent for user {user_id}")
        else:
            telegram_logger.warning(f"⚠️ Failed to send admin notification: {response.status_code}")
            
    except Exception as e:
        telegram_logger.error(f"💥 Error sending admin notification: {e}")

def get_or_create_thread(user: User):
    """Get or create a thread for the user"""
    try:
        # Use telegram_id as thread identifier
        thread_id = user.state_data.get('thread_id') if user.state_data and isinstance(user.state_data, dict) else None
        
        if not thread_id:
            # Create new thread
            client = openai.OpenAI(
                api_key=os.getenv('OPENAI_API_KEY'),
                default_headers={"OpenAI-Beta": "assistants=v2"}
            )
            thread = client.beta.threads.create()
            thread_id = thread.id
            
            # Store thread_id in user's state_data
            if not user.state_data:
                user.state_data = {}
            user.state_data['thread_id'] = thread_id
            db.session.commit()
            
            telegram_logger.info(f"🧵 Created new thread {thread_id} for user {user.full_name}")
        
        return thread_id
    except Exception as e:
        telegram_logger.error(f"💥 Error managing thread: {e}")
        return None

def cleanup_old_threads():
    """Clean up old threads to prevent accumulation (run periodically)"""
    try:
        client = openai.OpenAI(
            api_key=os.getenv('OPENAI_API_KEY'),
            default_headers={"OpenAI-Beta": "assistants=v2"}
        )
        
        # Get all threads (this is a simplified approach)
        # In production, you might want to implement a more sophisticated cleanup
        # based on thread age, message count, etc.
        
        # For now, we'll just log that cleanup was attempted
        telegram_logger.info("🧹 Thread cleanup attempted (simplified implementation)")
        
    except Exception as e:
        telegram_logger.error(f"💥 Error during thread cleanup: {e}")

def process_simple_commands(text: str, user: User) -> str:
    """Process simple commands without OpenAI"""
    text_lower = text.lower().strip()
    
    
    # Task commands - order matters! More specific patterns first
    if any(phrase in text_lower for phrase in ['show done tasks', 'done tasks', 'completed tasks']):
        return show_tasks_from_telegram({"status": "done"}, user)
    
    elif any(phrase in text_lower for phrase in ['show all tasks', 'all tasks']):
        return show_tasks_from_telegram({"status": "all"}, user)
    
    elif any(phrase in text_lower for phrase in ['show tasks', 'my tasks', 'list tasks', 'tasks']):
        return show_tasks_from_telegram({"status": "todo"}, user)
    
    # Project-specific task commands
    elif any(phrase in text_lower for phrase in ['show personal tasks', 'personal tasks', 'tasks personal']):
        return show_tasks_from_telegram({"status": "todo", "project": "Personal"}, user)
    
    elif any(phrase in text_lower for phrase in ['show alist tasks', 'alist tasks', 'tasks alist']):
        return show_tasks_from_telegram({"status": "todo", "project": "Alist"}, user)
    
    # Event commands - order matters! More specific patterns first
    elif any(phrase in text_lower for phrase in ['show tomorrow events', 'tomorrow events', 'events tomorrow', 'show tomorrow calendar', 'tomorrow calendar', 'calendar tomorrow', 'show tommorow events', 'tommorow events', 'events tommorow', 'show tommorow calendar', 'tommorow calendar', 'calendar tommorow']):
        return show_events_from_telegram({"period": "tomorrow"}, user)
    
    elif any(phrase in text_lower for phrase in ['show today events', 'today events', 'events today', 'show today calendar', 'today calendar', 'calendar today']):
        return show_events_from_telegram({"period": "today"}, user)
    
    elif any(phrase in text_lower for phrase in ['show week events', 'week events', 'events this week', 'show week calendar', 'week calendar', 'calendar this week', 'weekly events', 'show weekly events']):
        return show_events_from_telegram({"period": "weekly"}, user)
    
    elif any(phrase in text_lower for phrase in ['show events', 'my events', 'list events', 'events', 'show calendar', 'my calendar', 'list calendar', 'calendar']):
        return show_events_from_telegram({"period": "today"}, user)
    
    # Contact commands
    elif any(phrase in text_lower for phrase in ['show contacts', 'my contacts', 'list contacts', 'contacts']):
        return show_people_from_telegram({}, user)
    
    # Search commands
    elif text_lower.startswith('find ') or text_lower.startswith('search '):
        query = text_lower.replace('find ', '').replace('search ', '').strip()
        # Clean up common search patterns
        if 'people from ' in query:
            query = query.replace('people from ', '').strip()
        elif 'contacts from ' in query:
            query = query.replace('contacts from ', '').strip()
        elif 'persons from ' in query:
            query = query.replace('persons from ', '').strip()
        return search_from_telegram({"query": query, "type": "people"}, user)
    
    # Delete commands
    elif text_lower.startswith('delete ') or text_lower.startswith('remove '):
        task_title = text_lower.replace('delete ', '').replace('remove ', '').strip()
        # Handle "delete task X" format - remove "task" prefix if present
        if task_title.startswith('task '):
            task_title = task_title[5:]  # Remove "task" prefix
        return remove_task_from_telegram({"title": task_title}, user)
    
    # Update commands
    elif text_lower.startswith('update '):
        # Parse update commands like "update status of test2 task to done"
        # Extract task title and updates from the text
        update_text = text_lower.replace('update ', '').strip()
        
        telegram_logger.info(f"🔍 Parsing update command: '{update_text}'")
        telegram_logger.info(f"🔍 Text length: {len(update_text)}")
        telegram_logger.info(f"🔍 Contains 'status': {' status ' in update_text}")
        telegram_logger.info(f"🔍 Contains 'to': {' to ' in update_text}")
        
        # Handle patterns like "status of X task to Y" or "X task status to Y"
        if (' status ' in update_text or update_text.startswith('status ')) and ' to ' in update_text:
            telegram_logger.info(f"🔍 Found 'status' and 'to' in text")
            # Extract task title and new status
            if ' of ' in update_text:
                telegram_logger.info(f"🔍 Found 'of' in text")
                # Pattern: "status of X task to Y"
                parts = update_text.split(' of ')
                telegram_logger.info(f"🔍 Split by 'of': {parts}")
                if len(parts) == 2:
                    status_part = parts[1]
                    telegram_logger.info(f"🔍 Status part: '{status_part}'")
                    if ' task to ' in status_part:
                        telegram_logger.info(f"🔍 Found 'task to' in status part")
                        task_title, new_status = status_part.split(' task to ')
                        telegram_logger.info(f"🔍 Parsed: task_title='{task_title.strip()}', status='{new_status.strip()}'")
                        return update_task_from_telegram({
                            "task_id": task_title.strip(),
                            "updates": {"status": new_status.strip()}
                        }, user)
                    else:
                        telegram_logger.info(f"🔍 'task to' not found in status part: '{status_part}'")
            elif ' task status to ' in update_text:
                # Pattern: "X task status to Y"
                task_title, new_status = update_text.split(' task status to ')
                telegram_logger.info(f"🔍 Parsed: task_title='{task_title.strip()}', status='{new_status.strip()}'")
                return update_task_from_telegram({
                    "task_id": task_title.strip(),
                    "updates": {"status": new_status.strip()}
                }, user)
        
        # Handle other update patterns
        elif ' task ' in update_text and ' to ' in update_text:
            # Generic pattern: "X task Y to Z"
            parts = update_text.split(' task ')
            if len(parts) == 2:
                task_title = parts[0].strip()
                field_and_value = parts[1]
                if ' to ' in field_and_value:
                    field, value = field_and_value.split(' to ')
                    telegram_logger.info(f"🔍 Parsed: task_title='{task_title}', field='{field.strip()}', value='{value.strip()}'")
                    return update_task_from_telegram({
                        "task_id": task_title,
                        "updates": {field.strip(): value.strip()}
                    }, user)
        
        return None
    
    # Help
    elif any(phrase in text_lower for phrase in ['help', 'commands', 'what can you do']):
        return """🤖 **Available Commands:**

**Tasks:**
• "Show tasks" - Show your open tasks
• "Show all tasks" - Show all tasks
• "Show done tasks" - Show completed tasks

**Events:**
• "Show events" - Show today's events
• "Show tomorrow events" - Show tomorrow's events
• "Show week events" - Show this week's events

**Contacts:**
• "Show contacts" - Show your contacts
• "Find [name]" - Search for contacts

**Examples:**
• "Add task call John tomorrow"
• "Schedule meeting with Sarah tomorrow 2pm"
• "Find John Smith"

Need more features? Contact administrator to enable AI processing."""
    
    # Default fallback - return None to trigger natural language processing
    else:
        return None

def process_natural_language_request(text: str, user: User) -> str:
    """Process natural language requests using OpenAI Assistant API"""
    telegram_logger.info(f"🧠 Processing natural language request: '{text}' for user {user.full_name}")
    
    if not os.getenv('OPENAI_API_KEY'):
        telegram_logger.error("❌ OpenAI API key not configured")
        # Fallback to simple command parsing
        return process_simple_commands(text, user)

    try:
        # Get or create thread for user
        thread_id = get_or_create_thread(user)
        if not thread_id:
            return "❌ Error creating conversation thread. Please try again."
        
        # Initialize OpenAI client
        client = openai.OpenAI(
            api_key=os.getenv('OPENAI_API_KEY'),
            default_headers={"OpenAI-Beta": "assistants=v2"}
        )
        
        # Add user message to thread
        client.beta.threads.messages.create(
            thread_id=thread_id,
            role="user",
            content=text
        )
        
        # Run the assistant
        assistant_id = os.getenv('OPENAI_ASSISTANT_ID', 'asst_ywyYJshVjop8vd5hvXv1Nn1r')
        telegram_logger.info(f"🤖 Using assistant ID: {assistant_id}")
        
        run = client.beta.threads.runs.create(
            thread_id=thread_id,
            assistant_id=assistant_id
        )
        
        telegram_logger.info(f"🤖 Started assistant run {run.id} for user {user.full_name}")
        
        # Poll for completion
        import time
        max_attempts = 30  # 15 seconds max
        attempts = 0
        
        while attempts < max_attempts:
            run_status = client.beta.threads.runs.retrieve(
                thread_id=thread_id,
                run_id=run.id
            )
            
            if run_status.status in ["completed", "failed", "requires_action"]:
                break
                
            time.sleep(0.5)
            attempts += 1
        
        if run_status.status == "failed":
            telegram_logger.error(f"❌ Assistant run failed: {run_status.last_error}")
            return "❌ Sorry, I encountered an error processing your request."
        
        if run_status.status == "requires_action":
            telegram_logger.warning(f"⚠️ Assistant requires action: {run_status.required_action}")
            return "❌ Sorry, I need more information to process your request."
        
        # Get assistant's response
        messages = client.beta.threads.messages.list(thread_id=thread_id)
        
        # Find the latest assistant message
        assistant_response = None
        for msg in messages.data:
            if msg.role == "assistant":
                assistant_response = msg.content[0].text.value
                telegram_logger.info(f"🤖 Assistant response: '{assistant_response}'")
                break
        
        if not assistant_response:
            telegram_logger.error("❌ No assistant response found")
            return "❌ Sorry, I didn't receive a response from the assistant."
        
        telegram_logger.info(f"🤖 Assistant response: {assistant_response}")
        
        # Parse the JSON response
        try:
            telegram_logger.info(f"🔍 Raw assistant response: '{assistant_response}'")
            telegram_logger.info(f"🔍 Response type: {type(assistant_response)}")
            telegram_logger.info(f"🔍 Response length: {len(assistant_response)}")
            
            # Clean the response - remove any extra whitespace or newlines
            cleaned_response = assistant_response.strip()
            telegram_logger.info(f"🔍 Cleaned response: '{cleaned_response}'")
            
            function_data = json.loads(cleaned_response)
            function_number = function_data[0]
            parameters = function_data[1] if len(function_data) > 1 else None
            telegram_logger.info(f"🔧 Executing function {function_number} with parameters: {parameters}")
            return execute_bot_function(function_number, parameters, user, text)
        except (json.JSONDecodeError, IndexError) as parse_error:
            telegram_logger.warning(f"⚠️ Failed to parse assistant response: {parse_error}")
            telegram_logger.warning(f"⚠️ Raw response that failed: '{assistant_response}'")
            # Fallback to search
            return search_from_telegram({"query": text, "type": "people"}, user)
        
    except Exception as error:
        telegram_logger.error(f"💥 Assistant API error: {error}")
        # Fallback to search
        return search_from_telegram({"query": text, "type": "people"}, user)

def execute_bot_function(function_number: int, parameters: any, user: User, original_text: str) -> str:
    """Execute the function mapped by OpenAI"""
    telegram_logger.info(f"⚙️ Executing function {function_number} with params: {parameters} for user {user.full_name}")
    telegram_logger.info(f"⚙️ Function number type: {type(function_number)}")
    telegram_logger.info(f"⚙️ Parameters type: {type(parameters)}")
    
    try:
        # TASKS
        if function_number == 1:  # add_task
            telegram_logger.info(f"🎯 Calling add_task_from_telegram with: {parameters}")
            return add_task_from_telegram(parameters, user)
            
        elif function_number == 2:  # show_all_tasks
            return show_tasks_from_telegram(parameters, user)
            
        elif function_number == 3:  # remove_task
            return remove_task_from_telegram(parameters, user)
            
        elif function_number == 4:  # update_task
            return update_task_from_telegram(parameters, user)
            
        elif function_number == 5:  # add_alert_to_task
            return add_alert_to_task_from_telegram(parameters, user)
            
        # EVENTS
        elif function_number == 6:  # add_event
            return add_event_from_telegram(parameters, user)
            
        elif function_number == 7:  # show_all_events
            return show_events_from_telegram(parameters, user)
            
        elif function_number == 8:  # remove_event
            return remove_event_from_telegram(parameters, user)
            
        elif function_number == 9:  # update_event
            return update_event_from_telegram(parameters, user)
            
        # PEOPLE
        elif function_number == 10:  # add_people
            return add_people_from_telegram(parameters, user)
            
        elif function_number == 11:  # show_all_people
            return show_people_from_telegram(parameters, user)
            
        elif function_number == 12:  # update_person
            return update_person_from_telegram(parameters, user)
            
        elif function_number == 13:  # delete_person
            return delete_person_from_telegram(parameters, user)
            
        # SEARCH
        elif function_number == 14:  # search_information
            return search_from_telegram(parameters, user)
            
        else:
            telegram_logger.warning(f"🚧 Function {function_number} not implemented for user {user.full_name}")
            return f"🚧 Function {function_number} is not implemented yet."
    except Exception as e:
        telegram_logger.error(f"💥 Error executing function {function_number} for user {user.full_name}: {str(e)}")
        return f"Error executing function: {str(e)}"


def remove_task_from_telegram(args: any, user: User) -> str:
    """Remove a task from Telegram request"""
    try:
        # Use the user parameter directly - it's already loaded from the webhook
        if not user:
            return "❌ User not found. Please connect your Telegram account in the webapp first."

        # Extract task title from args - handle different formats
        if isinstance(args, dict):
            # Handle dictionary format: {'task_id': 'call mom'} or {'title': 'call mom'}
            search_term = args.get('task_id', '') or args.get('title', '')
        elif isinstance(args, str):
            search_term = args
            # Handle "delete task X" format - remove "task" prefix if present
            if search_term.lower().startswith('task '):
                search_term = search_term[5:]  # Remove "task " prefix
        else:
            search_term = str(args)

        # Search by title/text
        tasks = Task.query.filter(
            Task.owner_id == user.id,
            Task.is_active == True,
            db.or_(
                Task.title.ilike(f"%{search_term}%"),
                Task.text.ilike(f"%{search_term}%")
            )
        ).all()
        
        if not tasks:
            return f"❌ No tasks found matching: '{search_term}'"
        
        if len(tasks) == 1:
            # Single match, show confirmation
            task = tasks[0]
            task_title = task.title or task.text or "Untitled Task"
            task_project = task.project or "No project"
            
            # Set state to wait for confirmation
            user.state_data = {
                'current_state': 'waiting_task_delete_confirmation',
                'task_to_delete_id': task.id,
                'task_title': task_title
            }
            db.session.commit()
            
            return f"🗑️ Are you sure you want to delete this task?\n\n• <b>{task_title}</b>\n📁 {task_project}\n\nReply 'yes' to confirm or 'no' to cancel."
        else:
            # Multiple matches, show list and ask user to be more specific
            response = f"🔍 Found {len(tasks)} matching task(s). Please be more specific:\n\n"
            for i, task in enumerate(tasks[:5]):  # Show max 5 matches
                task_title = task.title or task.text or "Untitled Task"
                task_project = task.project or "No project"
                response += f"{i + 1}. <b>{task_title}</b>\n   📁 {task_project}\n"
                if task.due_date:
                    response += f"   📅 Due: {task.due_date.strftime('%Y-%m-%d %H:%M')}\n"
                response += "\n"
            
            if len(tasks) > 5:
                response += f"... and {len(tasks) - 5} more tasks.\n"
            
            response += "Please provide a more specific task title."
            return response
            
    except Exception as e:
        telegram_logger.error(f"💥 Error removing task: {str(e)}")
        return f"❌ Failed to remove task. Please try again."

def add_alert_to_task_from_telegram(args: any, user: User) -> str:
    """Add alert to task from Telegram request"""
    return "🚧 Task alerts feature coming soon!"

def show_tasks_from_telegram(args: dict, user: User) -> str:
    """Show tasks from Telegram request"""
    try:
        # User is already the correct user since we're using the same model
        # No need to find user - we already have it

        # Build query based on filters
        query = Task.query.filter(Task.owner_id == user.id, Task.is_active == True)
        
        # Apply status filter
        status_filter = args.get('status', 'todo')
        if status_filter == "all":
            pass  # Show all tasks
        elif status_filter == "done":
            query = query.filter(Task.status == "done")
        else:  # default to "todo" - show open tasks
            query = query.filter(Task.status.in_(["todo", "in_progress"]))
        
        # Apply project filter if specified
        project_filter = args.get('project')
        if project_filter:
            query = query.filter(Task.project == project_filter)
        
        # Order by due_date, then by created_at
        tasks = query.order_by(Task.due_date.asc().nulls_last(), Task.created_at.desc()).limit(20).all()
        
        if not tasks:
            return "📝 No tasks found."
        
        response = f"📝 Found {len(tasks)} task(s):\n\n"
        for task in tasks:
            status_emoji = "✅" if task.status == "done" else "🔄" if task.status == "in_progress" else "⏳"
            priority_emoji = "🔥" if task.priority == "high" else "🔹" if task.priority == "low" else "📌"
            
            # Use title if available, otherwise use text
            task_title = task.title or task.text or "Untitled Task"
            
            response += f"• <b>{task_title}</b>\n"
            if task.project:
                response += f"📁 {task.project}\n"
            response += f"{status_emoji} Status: {task.status}\n"
            response += f"{priority_emoji} Priority: {task.priority}\n"
            if task.assign_to:
                response += f"👤 Assign: {task.assign_to}\n"
            if task.due_date:
                response += f"📅 Due: {task.due_date.strftime('%Y-%m-%d %H:%M')}\n"
            if task.label:
                response += f"🏷️ Label: {task.label}\n"
            if task.notes:
                response += f"📝 Notes: {task.notes}\n"
            response += "\n"
        
        return response
        
    except Exception as e:
        telegram_logger.error(f"💥 Error fetching tasks: {str(e)}")
        return f"❌ Failed to fetch tasks. Please try again."

def add_people_from_telegram(args: list, user: User) -> str:
    """Add people from Telegram request"""
    try:
        telegram_logger.info(f"👥 Adding people with args: {args}")
        
        # Use the user parameter directly - it's already loaded from the webhook
        if not user:
            return "❌ User not found. Please connect your Telegram account in the webapp first."

        results = []
        for person_data in args:
            # Handle datetime fields
            last_contact_date = None
            if person_data.get('last_contact_date'):
                try:
                    last_contact_date = datetime.strptime(person_data['last_contact_date'], '%Y-%m-%d %H:%M')
                except ValueError:
                    try:
                        last_contact_date = datetime.fromisoformat(person_data['last_contact_date'].replace('Z', ''))
                    except:
                        pass
            
            next_follow_up_date = None
            if person_data.get('next_follow_up_date'):
                try:
                    next_follow_up_date = datetime.strptime(person_data['next_follow_up_date'], '%Y-%m-%d %H:%M')
                except ValueError:
                    try:
                        next_follow_up_date = datetime.fromisoformat(person_data['next_follow_up_date'].replace('Z', ''))
                    except:
                        pass
            
            person = Person(
                first_name=person_data.get('first_name'),
                last_name=person_data.get('last_name'),
                gender=person_data.get('gender'),
                birthday=person_data.get('birthday'),
                organization=person_data.get('organization'),
                job_title=person_data.get('job_title'),
                job_status=person_data.get('job_status'),
                email=person_data.get('email'),
                phone=person_data.get('phone'),
                mobile=person_data.get('mobile'),
                address=person_data.get('address'),
                linkedin_url=person_data.get('linkedin_url'),
                github_url=person_data.get('github_url'),
                facebook_url=person_data.get('facebook_url'),
                twitter_url=person_data.get('twitter_url'),
                website_url=person_data.get('website_url'),
                notes=person_data.get('notes'),
                source=person_data.get('source'),
                tags=person_data.get('tags'),
                last_contact_date=last_contact_date,
                next_follow_up_date=next_follow_up_date,
                status=person_data.get('status'),
                priority=person_data.get('priority'),
                group=person_data.get('group'),
                custom_fields=person_data.get('custom_fields'),
                owner_id=user.id
            )
            
            if person.first_name:
                db.session.add(person)
                results.append(f"{person.first_name} {person.last_name or ''}".strip())
        
        db.session.commit()
        
        telegram_logger.info(f"✅ Added {len(results)} people: {results}")
        if results:
            return f"✅ Added {len(results)} person(s): {', '.join(results)}"
        else:
            return "❌ Could not add any people. Please check the details and try again."
        
    except Exception as e:
        telegram_logger.error(f"💥 Error adding people: {str(e)}")
        return f"❌ Failed to add people. Please try again."

def show_meetings_from_telegram(args: str, user: User) -> str:
    """Show meetings from Telegram request"""
    return "🚧 Meetings feature coming soon!"

def update_task_from_telegram(args: dict, user: User) -> str:
    """Update task from Telegram request"""
    try:
        telegram_logger.info(f"✏️ Updating task with args: {args}")
        
        # Use the user parameter directly - it's already loaded from the webhook
        if not user:
            return "❌ User not found. Please connect your Telegram account in the webapp first."

        task_id = args.get('task_id')
        updates = args.get('updates', {})
        
        if not task_id:
            return "❌ Task ID is required"
        
        # Find task - try by task_id first, then by title if task_id doesn't look like a UUID
        task = None
        if len(task_id) > 20 and '-' in task_id:  # Looks like a UUID
            task = Task.query.filter_by(task_id=task_id, owner_id=user.id).first()
        
        if not task:
            # Search by title instead
            task = Task.query.filter(
                Task.owner_id == user.id,
                Task.is_active == True,
                (Task.title.ilike(f'%{task_id}%') | Task.text.ilike(f'%{task_id}%'))
            ).first()
        
        if not task:
            return f"❌ Task with ID {task_id} not found"
        
        # Apply updates
        if 'title' in updates:
            task.title = updates['title']
        if 'description' in updates:
            task.description = updates['description']
        if 'project' in updates:
            task.project = updates['project']
        if 'status' in updates:
            task.status = updates['status']
        if 'priority' in updates:
            task.priority = updates['priority']
        if 'assign_to' in updates:
            assign_to_value = updates['assign_to']
            if assign_to_value:
                from bl.services.name_resolution_service import NameResolutionService
                
                # Check if it's already an email (contains @)
                if '@' in assign_to_value:
                    # It's already an email, validate it's in the group
                    user_preferences = user.user_preferences or {}
                    group_members = user_preferences.get('group_members', [])
                    group_emails = [member.get('email') for member in group_members if member.get('status') == 'approved']
                    
                    if assign_to_value not in group_emails:
                        group_list = NameResolutionService.get_group_members_list(user)
                        return f"❌ User {assign_to_value} is not in your group. {group_list}"
                else:
                    # It's a name, try to resolve it
                    resolved_email, error = NameResolutionService.resolve_name_to_email(user, assign_to_value)
                    if error:
                        group_list = NameResolutionService.get_group_members_list(user)
                        return f"❌ {error}. {group_list}"
                    assign_to_value = resolved_email
            
            task.assign_to = assign_to_value
        if 'label' in updates:
            task.label = updates['label']
        if 'notes' in updates:
            task.notes = updates['notes']
        if 'is_scheduled' in updates:
            task.is_scheduled = updates['is_scheduled']
        if 'is_active' in updates:
            task.is_active = updates['is_active']
        
        # Handle datetime updates
        if 'due_date' in updates:
            try:
                task.due_date = datetime.strptime(updates['due_date'], '%Y-%m-%d %H:%M')
            except ValueError:
                try:
                    task.due_date = datetime.fromisoformat(updates['due_date'].replace('Z', ''))
                except:
                    return f"❌ Invalid due_date format: {updates['due_date']}"
        
        if 'scheduled_date' in updates:
            try:
                task.scheduled_date = datetime.strptime(updates['scheduled_date'], '%Y-%m-%d %H:%M')
            except ValueError:
                try:
                    task.scheduled_date = datetime.fromisoformat(updates['scheduled_date'].replace('Z', ''))
                except:
                    return f"❌ Invalid scheduled_date format: {updates['scheduled_date']}"
        
        if 'alert_time' in updates:
            try:
                task.alert_time = datetime.strptime(updates['alert_time'], '%Y-%m-%d %H:%M')
            except ValueError:
                try:
                    task.alert_time = datetime.fromisoformat(updates['alert_time'].replace('Z', ''))
                except:
                    return f"❌ Invalid alert_time format: {updates['alert_time']}"
        
        task.updated_at = datetime.utcnow()
        db.session.commit()
        
        telegram_logger.info(f"✅ Task updated: {task_id} - {task.title or task.text}")
        return f"✅ Task '{task.title or task.text}' updated successfully!"
        
    except Exception as e:
        telegram_logger.error(f"💥 Error updating task: {str(e)}")
        return f"❌ Failed to update task. Please try again."

def update_person_from_telegram(args: dict, user: User) -> str:
    """Update person from Telegram request"""
    try:
        telegram_logger.info(f"✏️ Updating person with args: {args}")
        
        # Find the user associated with this telegram user
        user = User.query.filter_by(telegram_id=user.telegram_id).first()
        if not user:
            return "❌ User not found. Please connect your Telegram account in the webapp first."

        person_id = args.get('person_id')
        updates = args.get('updates', {})
        
        if not person_id:
            return "❌ Person ID is required"
        
        # Find person
        person = Person.query.filter_by(id=person_id, owner_id=user.id).first()
        if not person:
            return f"❌ Person with ID {person_id} not found"
        
        # Apply updates
        if 'full_name' in updates:
            person.full_name = updates['full_name']
        if 'company' in updates:
            person.company = updates['company']
        if 'categories' in updates:
            person.categories = updates['categories']
        if 'email' in updates:
            person.email = updates['email']
        if 'newsletter' in updates:
            person.newsletter = updates['newsletter']
        if 'status' in updates:
            person.status = updates['status']
        if 'linkedin_profile' in updates:
            person.linkedin_profile = updates['linkedin_profile']
        if 'poc_in_apex' in updates:
            person.poc_in_apex = updates['poc_in_apex']
        if 'who_warm_intro' in updates:
            person.who_warm_intro = updates['who_warm_intro']
        if 'agenda' in updates:
            person.agenda = updates['agenda']
        if 'meeting_notes' in updates:
            person.meeting_notes = updates['meeting_notes']
        if 'should_avishag_meet' in updates:
            person.should_avishag_meet = updates['should_avishag_meet']
        if 'more_info' in updates:
            person.more_info = updates['more_info']
        if 'job_title' in updates:
            person.job_title = updates['job_title']
        if 'tags' in updates:
            person.tags = updates['tags']
        if 'zog' in updates:
            person.zog = updates['zog']
        if 'intel_144' in updates:
            person.intel_144 = updates['intel_144']
        if 'connection_strength' in updates:
            person.connection_strength = updates['connection_strength']
        if 'country' in updates:
            person.country = updates['country']
        
        # Handle datetime updates
        if 'last_email_interaction' in updates:
            try:
                person.last_email_interaction = datetime.strptime(updates['last_email_interaction'], '%Y-%m-%d %H:%M')
            except ValueError:
                try:
                    person.last_email_interaction = datetime.fromisoformat(updates['last_email_interaction'].replace('Z', ''))
                except:
                    return f"❌ Invalid last_email_interaction format: {updates['last_email_interaction']}"
        
        if 'next_due_task' in updates:
            try:
                person.next_due_task = datetime.strptime(updates['next_due_task'], '%Y-%m-%d %H:%M')
            except ValueError:
                try:
                    person.next_due_task = datetime.fromisoformat(updates['next_due_task'].replace('Z', ''))
                except:
                    return f"❌ Invalid next_due_task format: {updates['next_due_task']}"
        
        person.updated_at = datetime.utcnow()
        db.session.commit()
        
        telegram_logger.info(f"✅ Person updated: {person_id} - {person.full_name}")
        return f"✅ Person '{person.full_name}' updated successfully!"
        
    except Exception as e:
        telegram_logger.error(f"💥 Error updating person: {str(e)}")
        return f"❌ Failed to update person. Please try again."

def delete_person_from_telegram(args: any, user: User) -> str:
    """Delete person from Telegram request"""
    try:
        telegram_logger.info(f"🗑️ Deleting person with args: {args}")
        
        # Find the user associated with this telegram user
        user = User.query.filter_by(telegram_id=user.telegram_id).first()
        if not user:
            return "❌ User not found. Please connect your Telegram account in the webapp first."

        person_id = args.get('person_id') if isinstance(args, dict) else args
        
        if not person_id:
            return "❌ Person ID is required"
        
        # Find and delete person
        person = Person.query.filter_by(id=person_id, owner_id=user.id).first()
        if not person:
            return f"❌ Person with ID {person_id} not found"
        
        person_name = person.full_name
        db.session.delete(person)
        db.session.commit()
        
        telegram_logger.info(f"✅ Person deleted: {person_id} - {person_name}")
        return f"✅ Person '{person_name}' deleted successfully!"
        
    except Exception as e:
        telegram_logger.error(f"💥 Error deleting person: {str(e)}")
        return f"❌ Failed to delete person. Please try again."

def add_person_from_telegram(args: dict, user: User) -> str:
    """Add a person from Telegram request"""
    try:
        # Find the user associated with this telegram user
        user = User.query.filter_by(email=user.telegram_username + "@telegram.local").first()
        if not user:
            # Create a user for this telegram user
            user = User(
                id=str(uuid.uuid4()),
                email=user.telegram_username + "@telegram.local",
                full_name=user.full_name,
                is_approved=True
            )
            db.session.add(user)
            db.session.commit()

        # Create the person
        person = Person(
            id=str(uuid.uuid4()),
            full_name=args.get('full_name'),
            email=args.get('email'),
            company=args.get('company'),
            linkedin_profile=args.get('linkedin_profile'),
            categories=args.get('categories', []),
            status=args.get('status', 'cold'),
            notes=args.get('notes'),
            owner_id=user.id
        )
        
        db.session.add(person)
        db.session.commit()
        
        return f"✅ Added {person.full_name} to your contacts!"
        
    except Exception as e:
        return f"❌ Error adding person: {str(e)}"

def add_company_from_telegram(args: dict, user: User) -> str:
    """Add a company from Telegram request"""
    try:
        # Find the user associated with this telegram user
        user = User.query.filter_by(telegram_id=user.telegram_id).first()
        if not user:
            return "❌ User not found. Please connect your Telegram account in the webapp first."

        # Create the company
        company = Company(
            id=str(uuid.uuid4()),
            name=args.get('name'),
            description=args.get('description'),
            linkedin_profile=args.get('linkedin_profile'),
            categories=args.get('categories', []),
            domains=args.get('domains', []),
            owner_id=user.id
        )
        
        db.session.add(company)
        db.session.commit()
        
        return f"✅ Added {company.name} to your companies!"
        
    except Exception as e:
        return f"❌ Error adding company: {str(e)}"

def add_task_from_telegram(args: dict, user: User) -> str:
    """Add a task from Telegram request"""
    try:
        # User is already the correct user since we're using the same model
        # No need to find user - we already have it

        # Parse due_date if provided
        due_date = None
        if args.get('due_date'):
            try:
                from datetime import datetime, timedelta
                # Handle different date formats
                due_date_str = args.get('due_date')
                if 'T' in due_date_str:
                    # ISO format: 2025-09-20T15:30
                    due_date = datetime.fromisoformat(due_date_str.replace('T', ' '))
                else:
                    # Simple format: 2025-09-20 15:30
                    due_date = datetime.fromisoformat(due_date_str)
            except Exception as e:
                print(f"Error parsing due_date '{args.get('due_date')}': {e}")
                # Continue without due_date if parsing fails

        # Generate sequential task_id
        max_task_id = db.session.query(db.func.max(Task.task_id)).filter(
            Task.owner_id == user.id
        ).scalar()
        # Convert to int if it's a string, otherwise use 0
        try:
            max_task_id_int = int(max_task_id) if max_task_id else 0
        except (ValueError, TypeError):
            max_task_id_int = 0
        next_task_id = max_task_id_int + 1

        # Create the task
        task = Task(
            id=str(uuid.uuid4()),
            task_id=next_task_id,
            text=args.get('text'),
            assign_to=args.get('assign_to'),
            due_date=due_date,
            status=args.get('status', 'todo'),
            priority=args.get('priority', 'medium'),
            label=args.get('label'),
            owner_id=user.id,
            created_by=user.id
        )
        
        db.session.add(task)
        db.session.commit()
        
        return f"✅ Added task: {task.text}"
        
    except Exception as e:
        return f"❌ Error adding task: {str(e)}"

def search_from_telegram(args: dict, user: User) -> str:
    """Search for information from Telegram request"""
    try:
        query = args.get('query', '')
        search_type = args.get('type', 'people')
        
        # User is already the correct user since we're using the same model
        # No need to find user - we already have it

        results = []
        
        if search_type == 'people':
            # Handle special cases for "contacts" and "persons"
            if query.lower() in ['contacts', 'persons', 'people', 'all contacts', 'all persons', 'show all contacts', 'show all persons']:
                people = Person.query.filter(Person.owner_id == user.id).limit(10).all()
            else:
                # Search in first_name, last_name, email, and organization
                people = Person.query.filter(
                    Person.owner_id == user.id,
                    db.or_(
                        Person.first_name.ilike(f'%{query}%'),
                        Person.last_name.ilike(f'%{query}%'),
                        Person.email.ilike(f'%{query}%'),
                        Person.organization.ilike(f'%{query}%')
                    )
                ).limit(5).all()
            
            results = []
            for p in people:
                # Get full name from first_name and last_name
                full_name = f"{p.first_name or ''} {p.last_name or ''}".strip() or "Unknown"
                result = f"👤 {full_name}"
                if p.email:
                    result += f" ({p.email})"
                if p.organization:
                    result += f"\n   🏢 {p.organization}"
                if p.status:
                    result += f"\n   💼 {p.status}"
                if p.tags:
                    result += f"\n   🏷️ {p.tags}"
                if p.linkedin_url:
                    result += f"\n   🔗 LinkedIn: {p.linkedin_url}"
                if p.job_title:
                    result += f"\n   💼 {p.job_title}"
                if p.group:
                    result += f"\n   👥 {p.group}"
                results.append(result)
        elif search_type == 'companies':
            companies = Company.query.filter(
                Company.owner_id == user.id,
                Company.name.ilike(f'%{query}%')
            ).limit(5).all()
            results = [f"🏢 {c.name}" for c in companies]
        elif search_type == 'tasks':
            tasks = Task.query.filter(
                Task.owner_id == user.id,
                Task.text.ilike(f'%{query}%')
            ).limit(5).all()
            results = [f"📝 {t.text}" for t in tasks]
        
        if results:
            if search_type == 'people':
                # Add empty line between contacts
                return f"🔍 Found {len(results)} results:\n" + "\n\n".join(results)
            else:
                return f"🔍 Found {len(results)} results:\n" + "\n".join(results)
        else:
            return f"🔍 No {search_type} found matching '{query}'"
            
    except Exception as e:
        return f"❌ Error searching: {str(e)}"

@telegram_bp.route('/telegram/auth', methods=['POST'])
def telegram_auth():
    """Authenticate telegram user"""
    try:
        data = request.get_json()
        telegram_id = data.get('telegram_id')
        password = data.get('password')
        telegram_username = data.get('telegram_username')
        first_name = data.get('first_name')
        
        # Simple password check (you might want to implement proper auth)
        if password != "121212":  # From the original code
            return jsonify({'error': 'Invalid password'}), 401
        
        # Find or create user with telegram_id
        user = User.query.filter_by(telegram_id=telegram_id).first()
        
        if not user:
            user = User(
                id=str(uuid.uuid4()),
                telegram_id=telegram_id,
                telegram_username=telegram_username,
                full_name=first_name,
                email=f"{telegram_username}@telegram.local",  # Temporary email
                is_approved=True  # Auto-approve telegram users
            )
            db.session.add(user)
        else:
            user.telegram_username = telegram_username
            user.full_name = first_name
        
        db.session.commit()
        
        return jsonify({
            'message': 'Authentication successful',
            'user': user.to_dict()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@telegram_bp.route('/telegram/check', methods=['POST'])
def telegram_check():
    """Check telegram authentication status"""
    try:
        data = request.get_json()
        telegram_id = data.get('telegram_id')
        
        user = User.query.filter_by(
            telegram_id=telegram_id
        ).first()
        
        return jsonify({
            'authenticated': user is not None
        })
        
    except Exception as e:
        return jsonify({
            'authenticated': False,
            'error': str(e)
        }), 500

@telegram_bp.route('/telegram/webhook', methods=['POST'])
def telegram_webhook():
    """Handle Telegram webhook"""
    try:
        data = request.get_json()
        telegram_logger.info(f"📨 Webhook received: {json.dumps(data, indent=2)}")
        
        if 'message' not in data:
            return jsonify({'status': 'ok'})
        
        message = data['message']
        chat_id = message['chat']['id']
        user_id = message['from']['id']
        first_name = message['from'].get('first_name', 'Unknown')
        username = message['from'].get('username', 'Unknown')
        text = message.get('text', '')
        
        telegram_logger.info(f"👤 User: {first_name} (@{username}) ID: {user_id}")
        telegram_logger.info(f"💬 Message: '{text}' in chat {chat_id}")
        
        # Find or create user
        user = User.query.filter_by(telegram_id=user_id).first()
        if not user:
            telegram_logger.info(f"👤 New user: {first_name}")
            user = User(
                telegram_id=user_id,
                full_name=first_name,
                email=f"{user_id}@telegram.local"
            )
            db.session.add(user)
            db.session.commit()
        else:
            telegram_logger.info(f"👤 Existing user found: {user.full_name} (ID: {user.id})")
        
        # User is already the webapp user since we're using the same model
        webapp_user = user  # Since we're using the same User model
        
        # Handle different commands
        telegram_logger.info(f"🔍 Processing command: '{text}' for user {user.full_name}")
        
        # Initialize response_text
        response_text = ""
        
        if text == '/start':
            telegram_logger.info(f"🚀 User {user.full_name} started the bot")
            if not user.state_data:
                user.state_data = {}
            user.state_data['current_state'] = 'idle'
            user.state_data = {}
            db.session.commit()
            
            response_text = f"👋 Welcome back {user.full_name}!\n\nYou can use natural language commands like:\n• 'Add roee'\n• 'Show my tasks'\n• 'Find contacts'"
        elif text == '/help':
            telegram_logger.info(f"❓ User {user.full_name} requested help")
            response_text = """Available commands:
/start - Start the bot
/help - Show this help message
/auth - Authenticate (requires webapp connection)
/status - Check your status

To use this bot, you need to connect your Telegram account via the webapp first."""
        elif text == '/auth':
            telegram_logger.info(f"🔐 User {user.full_name} checked connection status")
            if webapp_user:
                response_text = "✅ You are connected to your webapp account! You can now use the bot."
            else:
                response_text = f"🔐 **Not Connected**\n\nTo use this bot, connect your Telegram account via the webapp:\n\n**Your Telegram ID:** `{user.telegram_id}`\n\n**Steps to connect:**\n1. Go to: https://d2fq8k5py78ii.cloudfront.net/\n2. Login to your account\n3. Go to Settings tab\n4. Enter your Telegram ID: `{user.telegram_id}`\n5. Click 'Connect Telegram'"
        elif text == '/status':
            if webapp_user:
                auth_status = 'Connected to webapp'
                telegram_logger.info(f"📊 User {user.full_name} checked status: {auth_status}")
                response_text = f"Status: {auth_status}\n\nYou can use natural language commands like:\n• 'Add roee'\n• 'Show my tasks'\n• 'Find contacts'"
            else:
                auth_status = 'Not connected to webapp'
                telegram_logger.info(f"📊 User {user.full_name} checked status: {auth_status}")
                response_text = f"Status: {auth_status}\n\nConnect via webapp to use the bot:\nhttps://d2fq8k5py78ii.cloudfront.net/"
        else:
            # Handle state-based responses first
            telegram_logger.info(f"🔍 Current state for user {user.full_name}: '{user.state_data.get('current_state') if user.state_data else None}'")
            
            if user.state_data and user.state_data.get('current_state') == 'waiting_task_delete_confirmation':
                # User is confirming task deletion
                if text.lower().strip() in ['yes', 'y', 'confirm', 'ok', 'sure', 'yeah', 'yep']:
                    task_id = user.state_data.get('task_to_delete_id')
                    task_title = user.state_data.get('task_title', 'Unknown Task')
                    
                    if task_id:
                        # Delete the task
                        task = Task.query.filter(Task.id == task_id, Task.owner_id == user.id).first()
                        if task:
                            db.session.delete(task)
                            db.session.commit()
                            
                            # Reset state
                            user.state_data = None
                            db.session.commit()
                            
                            response_text = f"✅ Task '<b>{task_title}</b>' deleted successfully."
                        else:
                            response_text = "❌ Task not found or already deleted."
                            # Reset state
                            user.state_data = None
                            db.session.commit()
                    else:
                        response_text = "❌ Error: Task ID not found. Please try again."
                        # Reset state
                        user.state_data = None
                        db.session.commit()
                        
                elif text.lower().strip() in ['no', 'n', 'cancel', 'nope', 'nah']:
                    # User cancelled deletion
                    task_title = user.state_data.get('task_title', 'Unknown Task')
                    
                    # Reset state
                    user.state_data = None
                    db.session.commit()
                    
                    response_text = f"❌ Task '<b>{task_title}</b>' deletion cancelled."
                else:
                    response_text = "❌ Please reply 'yes' to confirm or 'no' to cancel."
            else:
                # Try simple commands first
                simple_response = process_simple_commands(text, user)
                if simple_response:
                    response_text = simple_response
                else:
                    # Use OpenAI to process natural language requests
                    if webapp_user:
                        telegram_logger.info(f"🤖 Processing natural language request for user {user.full_name}: '{text}'")
                        response_text = process_natural_language_request(text, user)
                        telegram_logger.info(f"🤖 OpenAI response for user {user.full_name}: '{response_text[:100]}...'")
                    else:
                        telegram_logger.info(f"🚫 Unconnected user {user.full_name} tried to use bot: '{text}'")
                        response_text = "🔐 Please connect your Telegram account via the webapp first. Send /start for instructions."
        
        # Log response being sent
        telegram_logger.info(f"📤 Sending response to user {user.full_name}: '{response_text[:100]}...'")
        
        # Send response back to telegram
        try:
            bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
            if bot_token:
                url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
                data = {
                    'chat_id': chat_id,
                    'text': response_text,
                    'parse_mode': 'HTML'
                }
                
                response = requests.post(url, data=data, timeout=10)
                if response.status_code == 200:
                    telegram_logger.info(f"✅ Message sent successfully to user {user.full_name}")
                else:
                    telegram_logger.error(f"❌ Failed to send message to user {user.full_name}: {response.status_code} - {response.text}")
            else:
                telegram_logger.error("❌ Telegram bot token not configured")
        except Exception as e:
            telegram_logger.error(f"💥 Error sending message to user {user.full_name}: {str(e)}")
        
        return jsonify({'status': 'ok', 'response': response_text})
        
    except Exception as e:
        telegram_logger.error(f"💥 Error processing Telegram webhook for user {user_id}: {str(e)}")
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@telegram_bp.route('/telegram/status', methods=['GET'])
@jwt_required()
def telegram_status():
    """Get telegram connection status"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'connected': current_user.telegram_id is not None,
            'telegram_user': {
                'id': current_user.id,
                'telegram_id': current_user.telegram_id,
                'telegram_username': current_user.telegram_username,
                'first_name': current_user.full_name
            } if current_user.telegram_id else None
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# EVENT FUNCTIONS
def add_event_from_telegram(args: dict, user: User) -> str:
    """Add an event from Telegram request"""
    try:
        telegram_logger.info(f"📅 Adding event with args: {args}")
        
        # Use the user parameter directly - it's already loaded from the webhook
        if not user:
            return "❌ User not found. Please connect your Telegram account in the webapp first."

        # Parse datetime fields
        start_datetime = None
        end_datetime = None
        
        if args.get('start_datetime'):
            try:
                start_datetime = datetime.strptime(args['start_datetime'], '%Y-%m-%d %H:%M')
            except ValueError:
                try:
                    start_datetime = datetime.fromisoformat(args['start_datetime'].replace('Z', ''))
                except:
                    return f"❌ Invalid start_datetime format: {args['start_datetime']}"
        
        if args.get('end_datetime'):
            try:
                end_datetime = datetime.strptime(args['end_datetime'], '%Y-%m-%d %H:%M')
            except ValueError:
                try:
                    end_datetime = datetime.fromisoformat(args['end_datetime'].replace('Z', ''))
                except:
                    return f"❌ Invalid end_datetime format: {args['end_datetime']}"
        
        # If only start_datetime provided, assume 1 hour duration
        if start_datetime and not end_datetime:
            end_datetime = start_datetime + timedelta(hours=1)
        
        if not start_datetime or not end_datetime:
            return "❌ Both start_datetime and end_datetime are required"
        
        # Resolve participant names to emails if needed
        participants = args.get('participants', [])
        if participants:
            from bl.services.name_resolution_service import NameResolutionService
            
            resolved_participants, error = NameResolutionService.resolve_participants(user, participants)
            if error:
                group_list = NameResolutionService.get_group_members_list(user)
                return f"❌ {error}. {group_list}"
            participants = resolved_participants
        
        # Create event
        event = Event(
            title=args.get('title', 'Untitled Event'),
            description=args.get('description'),
            start_datetime=start_datetime,
            end_datetime=end_datetime,
            location=args.get('location'),
            event_type=args.get('event_type', 'event'),
            project=args.get('project', ''),
            participants=participants,
            owner_id=user.id,  # Use owner_id instead of user_id
            alert_minutes=args.get('alert_minutes', 15),
            repeat_pattern=args.get('repeat_pattern'),
            repeat_interval=args.get('repeat_interval', 1),
            repeat_days=args.get('repeat_days'),
            repeat_end_date=datetime.strptime(args['repeat_end_date'], '%Y-%m-%d %H:%M') if args.get('repeat_end_date') else None,
            notes=args.get('notes'),
            is_active=args.get('is_active', True),
            user_id=user.id
        )
        
        db.session.add(event)
        db.session.commit()
        
        telegram_logger.info(f"✅ Event created: {event.id} - {event.title}")
        return f"✅ Event '{event.title}' created successfully!"
        
    except Exception as e:
        telegram_logger.error(f"💥 Error adding event: {str(e)}")
        return f"❌ Failed to add event. Please try again."

def show_events_from_telegram(args: dict, user: User) -> str:
    """Show events from Telegram request"""
    try:
        telegram_logger.info(f"📅 Showing events with args: {args}")
        
        # Use the user parameter directly - it's already loaded from the webhook
        if not user:
            return "❌ User not found. Please connect your Telegram account in the webapp first."

        period = args.get('period', 'today')
        start_date = args.get('start_date')
        end_date = args.get('end_date')
        filter_obj = args.get('filter', {})
        
        # Build query - include events where user is owner OR participant
        from sqlalchemy import or_, and_, text
        
        # Single query with OR conditions to avoid UNION issues with JSON fields
        query = Event.query.filter(
            Event.is_active == True,
            or_(
                Event.user_id == user.id,  # User is the owner
                Event.participants.op('@>')(f'[{{"email": "{user.email}"}}]')  # User is a participant
            )
        )
        telegram_logger.info(f"📅 Base query: user_id={user.id} OR participant email={user.email}, is_active=True")
        
        # Apply date filters
        now = datetime.utcnow()
        telegram_logger.info(f"📅 Current time: {now}")
        
        # Apply date filters
        if start_date:
            try:
                start_datetime = datetime.strptime(start_date, '%Y-%m-%d %H:%M')
                query = query.filter(Event.start_datetime >= start_datetime)
                telegram_logger.info(f"📅 Applied start_date filter: {start_datetime}")
            except ValueError:
                try:
                    start_datetime = datetime.fromisoformat(start_date.replace('Z', ''))
                    query = query.filter(Event.start_datetime >= start_datetime)
                    telegram_logger.info(f"📅 Applied start_date filter (isoformat): {start_datetime}")
                except:
                    return f"❌ Invalid start_date format: {start_date}"
        
        if end_date:
            try:
                end_datetime = datetime.strptime(end_date, '%Y-%m-%d %H:%M')
                query = query.filter(Event.start_datetime <= end_datetime)
                telegram_logger.info(f"📅 Applied end_date filter: {end_datetime}")
            except ValueError:
                try:
                    end_datetime = datetime.fromisoformat(end_date.replace('Z', ''))
                    query = query.filter(Event.start_datetime <= end_datetime)
                    telegram_logger.info(f"📅 Applied end_date filter (isoformat): {end_datetime}")
                except:
                    return f"❌ Invalid end_date format: {end_date}"
        
        # Apply period filter only if no specific dates are provided
        if not start_date and not end_date:
            if period == 'today':
                start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
                end_of_day = start_of_day + timedelta(days=1)
                query = query.filter(Event.start_datetime >= start_of_day, Event.start_datetime < end_of_day)
                telegram_logger.info(f"📅 Applied today filter: {start_of_day} to {end_of_day}")
            elif period == 'tomorrow':
                start_of_tomorrow = now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
                end_of_tomorrow = start_of_tomorrow + timedelta(days=1)
                query = query.filter(Event.start_datetime >= start_of_tomorrow, Event.start_datetime < end_of_tomorrow)
                telegram_logger.info(f"📅 Applied tomorrow filter: {start_of_tomorrow} to {end_of_tomorrow}")
            elif period == 'weekly':
                # Show events from today onwards for the rest of this week
                start_of_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
                end_of_week = start_of_today + timedelta(days=7)
                query = query.filter(Event.start_datetime >= start_of_today, Event.start_datetime < end_of_week)
                telegram_logger.info(f"📅 Applied weekly filter: {start_of_today} to {end_of_week}")
            elif period == 'monthly':
                start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                if start_of_month.month == 12:
                    end_of_month = start_of_month.replace(year=start_of_month.year + 1, month=1)
                else:
                    end_of_month = start_of_month.replace(month=start_of_month.month + 1)
                query = query.filter(Event.start_datetime >= start_of_month, Event.start_datetime < end_of_month)
                telegram_logger.info(f"📅 Applied monthly filter: {start_of_month} to {end_of_month}")
            # 'all' period shows all events (no additional filter)
        
        events = query.order_by(Event.start_datetime).all()
        telegram_logger.info(f"📅 Found {len(events)} events")
        
        if not events:
            if start_date or end_date:
                return f"📅 No events found for the specified date range."
            else:
                return f"📅 No events found for {period} period."
        
        # Format response
        if start_date or end_date:
            response = f"📅 **Events (Custom Date Range):**\n\n"
        else:
            response = f"📅 **Events ({period}):**\n\n"
            
        for event in events:
            start_time = event.start_datetime.strftime('%H:%M')
            end_time = event.end_datetime.strftime('%H:%M')
            date_str = event.start_datetime.strftime('%Y-%m-%d')
            
            response += f"• <b>{event.title}</b>\n"
            response += f"  📅 {date_str} {start_time}-{end_time}\n"
            if event.location:
                response += f"  📍 {event.location}\n"
            if event.description:
                response += f"  📝 {event.description[:100]}{'...' if len(event.description) > 100 else ''}\n"
            response += "\n"
        
        return response
        
    except Exception as e:
        telegram_logger.error(f"💥 Error showing events: {str(e)}")
        return f"❌ Failed to show events. Please try again."

def remove_event_from_telegram(args: any, user: User) -> str:
    """Remove an event from Telegram request"""
    try:
        telegram_logger.info(f"🗑️ Removing event with args: {args}")
        
        # Find the user associated with this telegram user
        user = User.query.filter_by(telegram_id=user.telegram_id).first()
        if not user:
            return "❌ User not found. Please connect your Telegram account in the webapp first."

        event_id = args.get('event_id') if isinstance(args, dict) else args
        
        if not event_id:
            return "❌ Event ID is required"
        
        # Find and delete event
        event = Event.query.filter_by(id=event_id, user_id=user.id).first()
        if not event:
            return f"❌ Event with ID {event_id} not found"
        
        event_title = event.title
        db.session.delete(event)
        db.session.commit()
        
        telegram_logger.info(f"✅ Event deleted: {event_id} - {event_title}")
        return f"✅ Event '{event_title}' deleted successfully!"
        
    except Exception as e:
        telegram_logger.error(f"💥 Error removing event: {str(e)}")
        return f"❌ Failed to remove event. Please try again."

def update_event_from_telegram(args: dict, user: User) -> str:
    """Update an event from Telegram request"""
    try:
        telegram_logger.info(f"✏️ Updating event with args: {args}")
        
        # Find the user associated with this telegram user
        user = User.query.filter_by(telegram_id=user.telegram_id).first()
        if not user:
            return "❌ User not found. Please connect your Telegram account in the webapp first."

        event_id = args.get('event_id')
        updates = args.get('updates', {})
        
        if not event_id:
            return "❌ Event ID is required"
        
        # Find event
        event = Event.query.filter_by(id=event_id, user_id=user.id).first()
        if not event:
            return f"❌ Event with ID {event_id} not found"
        
        # Apply updates
        if 'title' in updates:
            event.title = updates['title']
        if 'description' in updates:
            event.description = updates['description']
        if 'location' in updates:
            event.location = updates['location']
        if 'event_type' in updates:
            event.event_type = updates['event_type']
        if 'participants' in updates:
            participants = updates['participants']
            if participants:
                from bl.services.name_resolution_service import NameResolutionService
                
                resolved_participants, error = NameResolutionService.resolve_participants(user, participants)
                if error:
                    group_list = NameResolutionService.get_group_members_list(user)
                    return f"❌ {error}. {group_list}"
                participants = resolved_participants
            
            event.participants = participants
        if 'alert_minutes' in updates:
            event.alert_minutes = updates['alert_minutes']
        if 'notes' in updates:
            event.notes = updates['notes']
        if 'is_active' in updates:
            event.is_active = updates['is_active']
        
        # Handle datetime updates
        if 'start_datetime' in updates:
            try:
                event.start_datetime = datetime.strptime(updates['start_datetime'], '%Y-%m-%d %H:%M')
            except ValueError:
                try:
                    event.start_datetime = datetime.fromisoformat(updates['start_datetime'].replace('Z', ''))
                except:
                    return f"❌ Invalid start_datetime format: {updates['start_datetime']}"
        
        if 'end_datetime' in updates:
            try:
                event.end_datetime = datetime.strptime(updates['end_datetime'], '%Y-%m-%d %H:%M')
            except ValueError:
                try:
                    event.end_datetime = datetime.fromisoformat(updates['end_datetime'].replace('Z', ''))
                except:
                    return f"❌ Invalid end_datetime format: {updates['end_datetime']}"
        
        event.updated_at = datetime.utcnow()
        db.session.commit()
        
        telegram_logger.info(f"✅ Event updated: {event_id} - {event.title}")
        return f"✅ Event '{event.title}' updated successfully!"
        
    except Exception as e:
        telegram_logger.error(f"💥 Error updating event: {str(e)}")
        return f"❌ Failed to update event. Please try again."

def show_people_from_telegram(args: dict, user: User) -> str:
    """Show people from Telegram request"""
    try:
        telegram_logger.info(f"👥 Showing people with args: {args}")
        
        # Find the user associated with this telegram user
        user = User.query.filter_by(telegram_id=user.telegram_id).first()
        if not user:
            return "❌ User not found. Please connect your Telegram account in the webapp first."

        filter_obj = args.get('filter', {})
        
        # Build query
        query = Person.query.filter_by(owner_id=user.id)
        
        # Apply filters if provided
        if filter_obj.get('status'):
            query = query.filter(Person.status == filter_obj['status'])
        if filter_obj.get('company'):
            query = query.filter(Person.company.ilike(f"%{filter_obj['company']}%"))
        
        people = query.order_by(Person.first_name).limit(20).all()  # Limit to 20 for Telegram
        
        if not people:
            return "👥 No people found."
        
        # Format response
        response = f"👥 <b>People ({len(people)}):</b>\n\n"
        for person in people:
            # Get full name from first_name and last_name
            full_name = f"{person.first_name or ''} {person.last_name or ''}".strip() or "Unknown"
            response += f"• <b>{full_name}</b>\n"
            if person.organization:
                response += f"  🏢 {person.organization}\n"
            if person.email:
                response += f"  📧 {person.email}\n"
            if person.status:
                response += f"  📊 {person.status}\n"
            response += "\n"
        
        return response
        
    except Exception as e:
        telegram_logger.error(f"💥 Error showing people: {str(e)}")
        return f"❌ Failed to show people. Please try again."

@telegram_bp.route('/telegram/setup-webhook', methods=['POST'])
@jwt_required()
def setup_webhook():
    """Setup telegram webhook"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user or not current_user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        webhook_url = data.get('webhook_url')
        
        if not webhook_url:
            return jsonify({'error': 'webhook_url is required'}), 400
        
        # Set webhook with Telegram API
        bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
        if not bot_token:
            return jsonify({'error': 'Telegram bot token not configured'}), 500
        
        telegram_api_url = f"https://api.telegram.org/bot{bot_token}/setWebhook"
        response = requests.post(telegram_api_url, json={'url': webhook_url})
        
        if response.status_code == 200:
            return jsonify({'message': 'Webhook setup successful'})
        else:
            return jsonify({'error': 'Failed to setup webhook'}), 500
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
