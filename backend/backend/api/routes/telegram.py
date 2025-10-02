from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from dal.models import User, Person, Task
from dal.database import db
from datetime import datetime
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
            
            # Find the telegram user first
            telegram_user = TelegramUser.query.filter_by(telegram_id=user_id).first()
            if not telegram_user:
                telegram_logger.error(f"❌ Telegram user not found: {user_id}")
                send_telegram_message(chat_id, "❌ User not found. Please connect your Telegram account via the web app first.")
                return jsonify({'status': 'ok'})
            
            # Get the transcription from the user's state data
            if user.state_data and 'transcription' in user.state_data:
                transcription = user.state_data['transcription']
                telegram_logger.info(f"✅ Processing approved transcription: '{transcription}'")
                
                response_text = process_natural_language_request(transcription, telegram_user)
                send_telegram_message(chat_id, response_text)
                
                # Clear the state data
                user.state_data = None
                user.current_state = None
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
            telegram_user = TelegramUser.query.filter_by(telegram_id=user_id).first()
            if telegram_user:
                user.state_data = None
                user.current_state = None
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
        
        # Get or create telegram user
        telegram_user = TelegramUser.query.filter_by(telegram_id=user_id).first()
        
        if not telegram_user:
            telegram_logger.info(f"🆕 Creating new Telegram user for voice: {first_name} ID: {user_id}")
            telegram_user = TelegramUser(
                id=str(uuid.uuid4()),
                telegram_id=user_id,
                telegram_username=username,
                first_name=first_name,
                current_state='idle'
            )
            db.session.add(telegram_user)
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
                user.current_state = 'waiting_voice_approval'
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
        thread_id = user.state_data.get('thread_id') if user.state_data else None
        
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

def process_natural_language_request(text: str, user: User) -> str:
    """Process natural language requests using OpenAI Assistant API"""
    telegram_logger.info(f"🧠 Processing natural language request: '{text}' for user {user.full_name}")
    
    if not os.getenv('OPENAI_API_KEY'):
        telegram_logger.error("❌ OpenAI API key not configured")
        return "❌ OpenAI API not configured. Please contact administrator."

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
        run = client.beta.threads.runs.create(
            thread_id=thread_id,
            assistant_id="asst_alist"  # Your assistant ID
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
                break
        
        if not assistant_response:
            telegram_logger.error("❌ No assistant response found")
            return "❌ Sorry, I didn't receive a response from the assistant."
        
        telegram_logger.info(f"🤖 Assistant response: {assistant_response}")
        
        # Parse the JSON response
        try:
            function_data = json.loads(assistant_response)
            function_number = function_data[0]
            parameters = function_data[1] if len(function_data) > 1 else None
            telegram_logger.info(f"🔧 Executing function {function_number} with parameters: {parameters}")
            return execute_bot_function(function_number, parameters, telegram_user, text)
        except (json.JSONDecodeError, IndexError) as parse_error:
            telegram_logger.warning(f"⚠️ Failed to parse assistant response: {parse_error}")
            # Fallback to search
            return search_from_telegram({"query": text, "type": "people"}, telegram_user)
        
    except Exception as error:
        telegram_logger.error(f"💥 Assistant API error: {error}")
        # Fallback to search
        return search_from_telegram({"query": text, "type": "people"}, telegram_user)

def execute_bot_function(function_number: int, parameters: any, user: User, original_text: str) -> str:
    """Execute the function mapped by OpenAI"""
    telegram_logger.info(f"⚙️ Executing function {function_number} with params: {parameters} for user {user.full_name}")
    
    try:
        if function_number == 1:  # search_information
            if parameters and isinstance(parameters, list):
                search_query = ' '.join(parameters)
                return search_from_telegram({"query": search_query, "type": "people"}, user)
            else:
                return search_from_telegram({"query": original_text, "type": "people"}, user)
                
        elif function_number == 2:  # add_task
            return add_task_from_telegram(parameters, user)
            
        elif function_number == 3:  # remove_task
            return remove_task_from_telegram(parameters, user)
            
        elif function_number == 4:  # add_alert_to_task
            return add_alert_to_task_from_telegram(parameters, user)
            
        elif function_number == 5:  # show_all_tasks
            return show_tasks_from_telegram(parameters, user)
            
        elif function_number == 6:  # add_new_people
            return add_people_from_telegram(parameters, user)
            
        elif function_number == 7:  # show_all_meetings
            return show_meetings_from_telegram(parameters, user)
            
        elif function_number == 8:  # update_task_request
            return update_task_from_telegram(parameters, user)
            
        elif function_number == 9:  # update_person
            return update_person_from_telegram(parameters, user)
            
        elif function_number == 10:  # delete_person
            return delete_person_from_telegram(parameters, user)
            
        else:
            telegram_logger.warning(f"🚧 Function {function_number} not implemented for user {user.full_name}")
            return f"🚧 Function {function_number} is not implemented yet."
    except Exception as e:
        telegram_logger.error(f"💥 Error executing function {function_number} for user {user.full_name}: {str(e)}")
        return f"Error executing function: {str(e)}"

def add_task_from_telegram(args: dict, user: User) -> str:
    """Add a task from Telegram request"""
    try:
        print(f"DEBUG: add_task_from_telegram called with args: {args}")
        
        # Find the user associated with this telegram user
        user = User.query.filter_by(telegram_id=user.telegram_id).first()
        if not user:
            return "❌ User not found. Please connect your Telegram account in the webapp first."

        print(f"DEBUG: Found user: {user.email} (ID: {user.id})")

        # Generate a unique task_id - find the highest existing task_id for this user
        max_task = Task.query.filter(
            Task.owner_id == user.id,
            Task.task_id.isnot(None)
        ).order_by(Task.task_id.desc()).first()
        next_task_id = (max_task.task_id + 1) if max_task and max_task.task_id else 1
        
        print(f"DEBUG: Max task ID for user {user.id}: {max_task.task_id if max_task else 'None'}")
        print(f"DEBUG: Next task ID: {next_task_id}")
        
        # Handle due_date parsing
        due_date = None
        if args.get('due_date'):
            try:
                # Parse the due_date string (format: YYYY-MM-DD HH:MM)
                due_date_str = args.get('due_date')
                print(f"DEBUG: Parsing due_date: {due_date_str}")
                due_date = datetime.strptime(due_date_str, '%Y-%m-%d %H:%M')
                print(f"DEBUG: Parsed due_date: {due_date}")
            except ValueError as e:
                print(f"DEBUG: Error parsing due_date '{due_date_str}': {e}")
                # Try alternative format
                try:
                    due_date = datetime.fromisoformat(due_date_str.replace('Z', ''))
                    print(f"DEBUG: Parsed with isoformat: {due_date}")
                except:
                    print(f"DEBUG: Could not parse due_date: {due_date_str}")
        
        # Handle alert_time parsing
        alert_time = None
        if args.get('alert_time'):
            try:
                alert_time_str = args.get('alert_time')
                print(f"DEBUG: Parsing alert_time: {alert_time_str}")
                alert_time = datetime.strptime(alert_time_str, '%Y-%m-%d %H:%M')
                print(f"DEBUG: Parsed alert_time: {alert_time}")
            except ValueError as e:
                print(f"DEBUG: Error parsing alert_time '{alert_time_str}': {e}")
                try:
                    alert_time = datetime.fromisoformat(alert_time_str.replace('Z', ''))
                    print(f"DEBUG: Parsed alert_time with isoformat: {alert_time}")
                except:
                    print(f"DEBUG: Could not parse alert_time: {alert_time_str}")

        # Create the task
        task = Task(
            id=str(uuid.uuid4()),
            task_id=next_task_id,
            text=args.get('text'),
            assign_to=args.get('assign_to'),
            due_date=due_date,
            priority=args.get('priority', 'medium'),
            label=args.get('label'),
            status=args.get('status', 'todo'),
            notes=args.get('notes'),
            alert_time=alert_time,
            owner_id=user.id,
            created_by=user.id
        )
        
        print(f"DEBUG: Created task with ID: {task.id}, task_id: {task.task_id}, due_date: {task.due_date}")
        
        db.session.add(task)
        db.session.commit()
        
        print(f"DEBUG: After commit - task.task_id: {task.task_id}, due_date: {task.due_date}")
        
        # Refresh the task from database to make sure it's saved correctly
        db.session.refresh(task)
        print(f"DEBUG: After refresh - task.task_id: {task.task_id}, due_date: {task.due_date}")
        
        return f"✅ Added task #{task.task_id}: {task.text}"
        
    except Exception as e:
        return f"❌ Error adding task: {str(e)}"

def remove_task_from_telegram(args: any, user: User) -> str:
    """Remove a task from Telegram request"""
    try:
        # Find the user associated with this telegram user
        user = User.query.filter_by(telegram_id=user.telegram_id).first()
        if not user:
            return "❌ User not found. Please connect your Telegram account in the webapp first."

        # Extract task_id from args - handle different formats
        if isinstance(args, dict):
            # Handle dictionary format: {'task_id': 'call mom'}
            search_term = args.get('task_id', '')
        elif isinstance(args, str):
            search_term = args
        else:
            search_term = str(args)

        # Try to convert to int if it's a numeric string
        try:
            task_id = int(search_term)
            # Direct delete by task_id
            deleted_count = Task.query.filter(
                Task.owner_id == user.id,
                Task.task_id == task_id
            ).delete()
            
            if deleted_count > 0:
                db.session.commit()
                return f"✅ Task #{task_id} removed successfully."
            else:
                return f"❌ Task #{task_id} not found."
        except ValueError:
            # Search by text instead
            tasks = Task.query.filter(
                Task.owner_id == user.id,
                Task.text.ilike(f"%{search_term}%")
            ).all()
            
            if not tasks:
                return f"❌ No tasks found matching: {search_term}"
            
            if len(tasks) == 1:
                # Single match, delete directly
                task = tasks[0]
                task_name = task.text
                task_id = task.task_id
                db.session.delete(task)
                db.session.commit()
                return f"✅ Task #{task_id} '{task_name}' removed successfully."
            else:
                # Multiple matches, show list and set state for confirmation
                response = f"🔍 Found {len(tasks)} matching task(s). Reply with task number to delete:\n\n"
                for i, task in enumerate(tasks):
                    response += f"{i + 1}. Task #{task.task_id}: {task.text}"
                    if task.due_date:
                        response += f" (Due: {task.due_date.strftime('%Y-%m-%d %H:%M')})"
                    response += "\n"
                
                # Set state to wait for user selection
                user.current_state = 'waiting_task_delete_confirmation'
                # Store the search term to recreate the list
                user.state_data = {'search_term': search_term}
                db.session.commit()
                
                return response
            
    except Exception as e:
        return f"❌ Error removing task: {str(e)}"

def add_alert_to_task_from_telegram(args: any, user: User) -> str:
    """Add alert to task from Telegram request"""
    return "🚧 Task alerts feature coming soon!"

def show_tasks_from_telegram(args: dict, user: User) -> str:
    """Show tasks from Telegram request"""
    try:
        # User is already the correct user since we're using the same model
        # No need to find user - we already have it

        # Get tasks for the user
        tasks = Task.query.filter_by(owner_id=user.id).limit(20).all()
        
        if not tasks:
            return "📝 No tasks found."
        
        response = f"📝 Found {len(tasks)} task(s):\n\n"
        for task in tasks:
            status_emoji = "✅" if task.status == "completed" else "🔄" if task.status == "in-progress" else "⏳"
            priority_emoji = "🔥" if task.priority == "high" else "🔹" if task.priority == "low" else "📌"
            
            response += f"{status_emoji} {priority_emoji} {task.text}\n"
            response += f"ID: {task.task_id}\n"
            response += f"Status: {task.status}\n"
            response += f"Priority: {task.priority}\n"
            if task.assign_to:
                response += f"👤 {task.assign_to}\n"
            if task.due_date:
                response += f"📅 {task.due_date}\n"
            if task.label:
                response += f"🏷️ {task.label}\n"
            if task.notes:
                response += f"📝 Notes: {task.notes}\n"
            if task.alert_time:
                response += f"⏰ Alert: {task.alert_time}\n"
            response += "\n"
        
        return response
        
    except Exception as e:
        return f"❌ Error fetching tasks: {str(e)}"

def add_people_from_telegram(args: list, user: User) -> str:
    """Add people from Telegram request"""
    try:
        # User is already the correct user since we're using the same model
        # No need to find user - we already have it

        results = []
        for person_data in args:
            # Extract information from various possible field names
            full_name = (person_data.get('Full Name') or person_data.get('full_name') or 
                        person_data.get('name') or person_data.get('Name'))
            email = (person_data.get('Email') or person_data.get('email') or 
                    person_data.get('mail') or person_data.get('Mail'))
            company = (person_data.get('Company') or person_data.get('company') or 
                      person_data.get('works in') or person_data.get('works_in'))
            status = (person_data.get('Status') or person_data.get('status') or 
                     person_data.get('job_title') or person_data.get('position') or
                     person_data.get('role') or person_data.get('engineer') or
                     person_data.get('system engineer'))
            categories = (person_data.get('Categories') or person_data.get('categories') or 
                         person_data.get('tags') or person_data.get('interests') or
                         person_data.get('love') or person_data.get('hobbies') or
                         person_data.get('skills') or person_data.get('skill'))
            
            person = Person(
                id=str(uuid.uuid4()),
                full_name=full_name,
                email=email,
                company=company,
                categories=categories,
                status=status,
                linkedin_profile=person_data.get('linkedin_profile'),
                newsletter=person_data.get('Newsletter') or person_data.get('newsletter', False),
                should_avishag_meet=person_data.get('should_avishag_meet', False),
                owner_id=user.id,
                created_by=user.id
            )
            
            if person.full_name:
                db.session.add(person)
                results.append(person.full_name)
        
        db.session.commit()
        
        if results:
            return f"✅ Added {len(results)} person(s): {', '.join(results)}"
        else:
            return "❌ Could not add any people. Please check the details and try again."
        
    except Exception as e:
        return f"❌ Error adding people: {str(e)}"

def show_meetings_from_telegram(args: str, user: User) -> str:
    """Show meetings from Telegram request"""
    return "🚧 Meetings feature coming soon!"

def update_task_from_telegram(args: dict, user: User) -> str:
    """Update task from Telegram request"""
    try:
        if 'task_id' in args:
            # Direct update with task ID
            task = Task.query.filter_by(task_id=args['task_id']).first()
            if not task:
                return f"❌ Task {args['task_id']} not found."
            
            # Update fields
            if 'field' in args and 'new_value' in args:
                field = args['field']
                new_value = args['new_value']
                if field == 'status':
                    new_value = 'completed' if new_value == 'done' else ('pending' if new_value == 'todo' else new_value)
                setattr(task, field, new_value)
                db.session.commit()
                return f"✅ Task {args['task_id']} updated: {field} = {new_value}"
        else:
            # Search by words
            words = args.get('words', [])
            search_term = ' '.join(words)
            tasks = Task.query.filter(Task.text.ilike(f'%{search_term}%')).limit(10).all()
            
            if not tasks:
                return f"❌ No tasks found matching: {search_term}"
            
            response = f"🔍 Found {len(tasks)} matching task(s). Reply with task number to update:\n\n"
            for i, task in enumerate(tasks):
                response += f"{i + 1}. ID: {task.task_id} - {task.text}\n"
            
            return response
        
    except Exception as e:
        return f"❌ Error updating task: {str(e)}"

def update_person_from_telegram(args: dict, user: User) -> str:
    """Update person from Telegram request"""
    try:
        if 'person_id' in args:
            # Direct update with person ID
            person = Person.query.filter_by(id=args['person_id']).first()
            if not person:
                return f"❌ Person {args['person_id']} not found."
            
            updates = args.get('updates', {})
            for field, value in updates.items():
                setattr(person, field, value)
            db.session.commit()
            return f"✅ Person {person.full_name} updated successfully!"
        else:
            # Search by words
            words = args.get('words', [])
            search_term = ' '.join(words)
            people = Person.query.filter(Person.full_name.ilike(f'%{search_term}%')).limit(10).all()
            
            if not people:
                return f"❌ No person found with name containing: {search_term}"
            
            response = f"🔍 Found {len(people)} matching person(s). Reply with person number to update:\n\n"
            for i, person in enumerate(people):
                response += f"{i + 1}. {person.full_name}"
                if person.company:
                    response += f" ({person.company})"
                response += "\n"
            
            return response
        
    except Exception as e:
        return f"❌ Error updating person: {str(e)}"

def delete_person_from_telegram(args: any, user: User) -> str:
    """Delete person from Telegram request"""
    try:
        if isinstance(args, dict) and 'person_id' in args:
            # Direct delete with person ID
            person = Person.query.filter_by(id=args['person_id']).first()
            if not person:
                return f"❌ Person {args['person_id']} not found."
            
            person_name = person.full_name
            db.session.delete(person)
            db.session.commit()
            return f"✅ {person_name} deleted successfully."
        elif isinstance(args, dict) and 'words' in args:
            # Search by words
            words = args['words']
            search_term = ' '.join(words)
            people = Person.query.filter(Person.full_name.ilike(f'%{search_term}%')).limit(10).all()
            
            if not people:
                return f"❌ No person found with name containing: {search_term}"
            
            response = f"🔍 Found {len(people)} matching person(s). Reply with person number to delete:\n\n"
            for i, person in enumerate(people):
                response += f"{i + 1}. {person.full_name}"
                if person.company:
                    response += f" ({person.company})"
                response += "\n"
            
            return response
        elif isinstance(args, str):
            # Handle string parameter (from OpenAI function router)
            search_term = args
            people = Person.query.filter(Person.full_name.ilike(f'%{search_term}%')).limit(10).all()
            
            if not people:
                return f"❌ No person found with name containing: {search_term}"
            
            if len(people) == 1:
                # If only one match, delete it directly
                person = people[0]
                person_name = person.full_name
                db.session.delete(person)
                db.session.commit()
                return f"✅ {person_name} deleted successfully."
            else:
                # Multiple matches, show list and set state for confirmation
                response = f"🔍 Found {len(people)} matching person(s). Reply with person number to delete:\n\n"
                for i, person in enumerate(people):
                    response += f"{i + 1}. {person.full_name}"
                    if person.company:
                        response += f" ({person.company})"
                    response += "\n"
                
                # Set state to wait for user selection
                user.current_state = 'waiting_delete_confirmation'
                # Store the search term to recreate the list
                user.state_data = {'search_term': search_term}
                db.session.commit()
                
                return response
        else:
            return "❌ Invalid delete request."
        
    except Exception as e:
        return f"❌ Error deleting person: {str(e)}"

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
                from datetime import datetime
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
        next_task_id = max_task_id + 1 if max_task_id else 1

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
                people = Person.query.filter(
                    Person.owner_id == user.id,
                    Person.full_name.ilike(f'%{query}%')
                ).limit(5).all()
            
            results = []
            for p in people:
                result = f"👤 {p.full_name}"
                if p.email:
                    result += f" ({p.email})"
                if p.company:
                    result += f"\n   🏢 {p.company}"
                if p.status:
                    result += f"\n   💼 {p.status}"
                if p.categories:
                    result += f"\n   🏷️ {p.categories}"
                if p.linkedin_profile:
                    result += f"\n   🔗 LinkedIn: {p.linkedin_profile}"
                if p.newsletter:
                    result += f"\n   📧 Newsletter subscriber"
                if p.should_avishag_meet:
                    result += f"\n   🤝 Should meet with Avishag"
                if p.more_info:
                    result += f"\n   ℹ️ {p.more_info}"
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
    """Handle telegram webhook"""
    try:
        data = request.get_json()
        
        # Log incoming request
        telegram_logger.info(f"📨 Incoming Telegram webhook: {json.dumps(data, indent=2)}")
        
        # Handle callback queries (button clicks)
        if 'callback_query' in data:
            return handle_callback_query(data['callback_query'])
        
        if not data or 'message' not in data:
            telegram_logger.info("❌ No message in webhook data")
            return jsonify({'status': 'ok'})
        
        message = data['message']
        chat_id = message['chat']['id']
        user_id = message['from']['id']
        username = message['from'].get('username', 'Unknown')
        first_name = message['from'].get('first_name', 'Unknown')
        
        # Check if it's a voice message
        if 'voice' in message:
            telegram_logger.info(f"🎤 Voice message received from user {first_name}")
            return handle_voice_message(message, chat_id, user_id, first_name, username)
        
        # Check if it's a text message
        if 'text' not in message:
            telegram_logger.info(f"❌ No text or voice in message from user {first_name}")
            return jsonify({'status': 'ok'})
            
        text = message['text']
        
        # Log user and message details
        telegram_logger.info(f"👤 User: {first_name} (@{username}) ID: {user_id}")
        telegram_logger.info(f"💬 Message: '{text}' in chat {chat_id}")
        
        # Get or create user
        user = User.query.filter_by(telegram_id=user_id).first()
        
        if not user:
            telegram_logger.info(f"🆕 Creating new user for Telegram: {first_name} (@{username}) ID: {user_id}")
            user = User(
                id=str(uuid.uuid4()),
                telegram_id=user_id,
                full_name=message['from'].get('first_name'),
                email=f"telegram_{user_id}@temp.com"  # Temporary email for Telegram users
            )
            db.session.add(user)
            db.session.commit()
            telegram_logger.info(f"✅ New user created with ID: {user.id}")
        else:
            telegram_logger.info(f"👤 Existing user found: {user.full_name} (ID: {user.id})")
        
        # User is already the webapp user since we're using the same model
        
        # Handle different commands
        telegram_logger.info(f"🔍 Processing command: '{text}' for user {user.full_name}")
        
        # Since we're using the same User model, we can process commands directly
        # No need to check for webapp connection since user already exists
        
        if text == '/start':
            telegram_logger.info(f"🚀 User {user.full_name} started the bot")
            user.current_state = 'idle'
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
            # Handle state-based responses
            telegram_logger.info(f"🔍 Current state for user {user.full_name}: '{user.current_state}'")
            if user.current_state == 'waiting_delete_confirmation':
                # User is selecting which contact to delete
                try:
                    selection = int(text.strip())
                    if user.state_data and 'search_term' in user.state_data:
                        search_term = user.state_data['search_term']
                        people = Person.query.filter(Person.full_name.ilike(f'%{search_term}%')).limit(10).all()
                        
                        if 1 <= selection <= len(people):
                            person = people[selection - 1]
                            person_name = person.full_name
                            db.session.delete(person)
                            db.session.commit()
                            
                            # Reset state
                            user.current_state = 'idle'
                            user.state_data = None
                            db.session.commit()
                            
                            response_text = f"✅ {person_name} deleted successfully."
                        else:
                            response_text = f"❌ Invalid selection. Please choose a number between 1 and {len(people)}."
                    else:
                        response_text = "❌ Error: No delete operation in progress. Please start over."
                except ValueError:
                    response_text = "❌ Please enter a valid number to select the contact to delete."
                except Exception as e:
                    response_text = f"❌ Error deleting contact: {str(e)}"
            elif user.current_state == 'waiting_email':
                # User is trying to authenticate but needs to connect via webapp first
                telegram_logger.info(f"📧 User {user.full_name} tried to authenticate but not connected to webapp")
                response_text = "🔗 Please connect your Telegram account via the webapp first:\n\n1. Go to your webapp settings\n2. Connect your Telegram account\n3. Then come back and use /auth again"
            else:
                # Use OpenAI to process natural language requests
                if webapp_user:
                    telegram_logger.info(f"🤖 Processing natural language request for user {user.full_name}: '{text}'")
                    response_text = process_natural_language_request(text, telegram_user)
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

# Old callback endpoint removed - callbacks are now handled in the main webhook

def answer_callback_query(callback_query_id, text):
    """Answer a Telegram callback query"""
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
        
        response = requests.post(url, data=data, timeout=5)
        if response.status_code == 200:
            telegram_logger.info(f"✅ Callback query answered: {text}")
        else:
            telegram_logger.error(f"❌ Failed to answer callback query: {response.status_code}")
            
    except Exception as e:
        telegram_logger.error(f"💥 Error answering callback query: {str(e)}")

@telegram_bp.route('/linkedin-profile-image', methods=['POST'])
def linkedin_profile_image():
    """Fetch LinkedIn profile image"""
    try:
        data = request.get_json()
        linkedin_url = data.get('linkedin_url')
        
        if not linkedin_url:
            return jsonify({'error': 'LinkedIn URL is required'}), 400
        
        # Validate LinkedIn URL format
        if 'linkedin.com/in/' not in linkedin_url:
            return jsonify({'error': 'Invalid LinkedIn profile URL'}), 400
        
        print(f'Fetching profile image for: {linkedin_url}')
        
        # Headers to mimic a real browser request
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
        
        # Fetch the LinkedIn profile page
        response = requests.get(linkedin_url, headers=headers, timeout=10)
        
        if not response.ok:
            print(f'Failed to fetch LinkedIn page: {response.status_code} {response.reason}')
            return jsonify({
                'error': 'Failed to load LinkedIn profile page',
                'profile_image_url': None
            }), 200
        
        html = response.text
        
        # Parse HTML to find profile image
        profile_image_url = extract_profile_image(html)
        
        if profile_image_url:
            print(f'Found profile image: {profile_image_url}')
            return jsonify({
                'success': True,
                'profile_image_url': profile_image_url,
                'linkedin_url': linkedin_url
            })
        else:
            print('No profile image found or profile is private')
            return jsonify({
                'success': False,
                'profile_image_url': None,
                'message': 'Profile image not found or profile is private',
                'linkedin_url': linkedin_url
            })
        
    except Exception as error:
        print(f'Error processing LinkedIn profile: {error}')
        return jsonify({
            'error': 'Internal server error',
            'profile_image_url': None,
            'details': str(error)
        }), 500

def extract_profile_image(html: str) -> str:
    """Extract profile image URL from LinkedIn HTML"""
    try:
        import re
        
        # Look for various patterns where LinkedIn profile images might be stored
        patterns = [
            # Main profile picture patterns
            r'"https://media\.licdn\.com/dms/image/[^"]*"',
            r'"https://media-exp\d*\.licdn\.com/dms/image/[^"]*"',
            # Backup patterns for profile images
            r'class="pv-top-card-profile-picture__image[^"]*"[^>]*src="([^"]*)"',
            r'class="profile-photo-edit__preview"[^>]*src="([^"]*)"',
            # Generic LinkedIn image patterns
            r'"https://media\.licdn\.com/[^"]*profile[^"]*"',
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, html)
            if matches:
                # Extract the URL from the match (remove quotes and clean up)
                image_url = matches[0].replace('"', '')
                
                # If it's from a src attribute, extract just the URL
                if 'src=' in image_url:
                    src_match = re.search(r'src="([^"]*)"', image_url)
                    if src_match:
                        image_url = src_match.group(1)
                
                # Validate that it's a proper LinkedIn media URL
                if ('media.licdn.com' in image_url and 
                    ('image' in image_url or 'profile' in image_url)):
                    # Clean up any additional parameters and ensure it's a proper image URL
                    clean_url = image_url.split('&')[0].split('?')[0]
                    return clean_url
        
        # Fallback: look for any img tag with LinkedIn profile indicators
        img_tag_pattern = r'<img[^>]*src="([^"]*)"[^>]*(?:class="[^"]*profile[^"]*"|alt="[^"]*profile[^"]*")'
        img_matches = re.findall(img_tag_pattern, html, re.IGNORECASE)
        
        for img_url in img_matches:
            if 'licdn.com' in img_url:
                return img_url
        
        return None
        
    except Exception as error:
        print(f'Error extracting profile image: {error}')
        return None

@telegram_bp.route('/telegram/connect', methods=['POST'])
@jwt_required()
def connect_telegram():
    """Connect telegram account to user"""
    try:
        current_user_id = get_jwt_identity()
        print(f"🔍 TELEGRAM CONNECT - JWT Identity: {current_user_id}")
        current_user = User.query.get(current_user_id)
        print(f"🔍 TELEGRAM CONNECT - User found: {current_user is not None}")
        if current_user:
            print(f"🔍 TELEGRAM CONNECT - User email: {current_user.email}")
            print(f"🔍 TELEGRAM CONNECT - User approved: {current_user.is_approved}")
            print(f"🔍 TELEGRAM CONNECT - User telegram_id: {current_user.telegram_id}")
        
        if not current_user:
            print(f"❌ TELEGRAM CONNECT - User not found")
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        telegram_id = data.get('telegram_id')
        
        if not telegram_id:
            return jsonify({'error': 'telegram_id is required'}), 400
        
        # Check if telegram_id is already connected to another user
        existing_user = User.query.filter_by(telegram_id=telegram_id).first()
        if existing_user and existing_user.id != current_user.id:
            return jsonify({'error': 'This Telegram ID is already connected to another account'}), 400
        
        # Update user with telegram_id
        current_user.telegram_id = telegram_id
        db.session.commit()
        
        return jsonify({
            'message': 'Telegram account connected successfully',
            'user': current_user.to_dict()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@telegram_bp.route('/telegram/disconnect', methods=['POST'])
@jwt_required()
def disconnect_telegram():
    """Disconnect telegram account from user"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user:
            return jsonify({'error': 'User not found'}), 404
        
        # Remove telegram_id from user
        current_user.telegram_id = None
        db.session.commit()
        
        return jsonify({
            'message': 'Telegram account disconnected successfully',
            'user': current_user.to_dict()
        })
        
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
            'telegram_id': current_user.telegram_id
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

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
