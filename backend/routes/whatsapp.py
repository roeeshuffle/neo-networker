from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User, TelegramUser
from database import db
from services.whatsapp_service import whatsapp_service
from services.messaging_service import messaging_service
import logging
import json
import requests
import openai
import os

whatsapp_bp = Blueprint('whatsapp', __name__)
whatsapp_logger = logging.getLogger('whatsapp')

def handle_whatsapp_voice_message(message_data, from_phone):
    """Handle voice message from WhatsApp"""
    try:
        audio_id = message_data.get('audio_id')
        whatsapp_logger.info(f"🎤 Processing WhatsApp voice message from {from_phone} (audio_id: {audio_id})")
        
        # Find user by WhatsApp phone
        user = User.query.filter_by(whatsapp_phone=from_phone).first()
        
        if not user:
            whatsapp_logger.info(f"❌ No user found with WhatsApp phone: {from_phone}")
            response_text = f"🔐 **Connection Required**\n\nTo use voice commands, you need to connect your WhatsApp account to your webapp account.\n\n**Your WhatsApp Phone:** `{from_phone}`\n\n**Steps to connect:**\n1. Go to your webapp: https://d2fq8k5py78ii.cloudfront.net/\n2. Login to your account\n3. Go to Settings tab\n4. Enter your WhatsApp phone: `{from_phone}`\n5. Click 'Connect WhatsApp'"
            whatsapp_service.send_message(from_phone, response_text)
            return jsonify({'status': 'ok'})
        
        # Check if user is approved
        if not user.is_approved:
            whatsapp_logger.info(f"❌ User {user.email} is not approved")
            response_text = "🔐 Your account is pending admin approval. Please wait for approval before using the bot."
            whatsapp_service.send_message(from_phone, response_text)
            return jsonify({'status': 'ok'})
        
        # Convert voice to text using OpenAI Whisper
        transcription = convert_whatsapp_voice_to_text(audio_id)
        
        if transcription:
            # Store transcription in user's state (we'll use a simple approach for WhatsApp)
            # Since WhatsApp doesn't have inline keyboards, we'll use a different approach
            response_text = f"🎤 **Voice Transcription:**\n\n\"{transcription}\"\n\n**Reply with 'yes' to approve or 'no' to ignore.**\n\n✅ Yes / ❌ No"
            whatsapp_service.send_message(from_phone, response_text)
            
            # Store the transcription in a temporary way (you could use Redis or database)
            # For now, we'll store it in the user's state_data field
            user.state_data = {'pending_voice_transcription': transcription}
            db.session.commit()
            
            return jsonify({'status': 'ok', 'response': 'Voice approval sent'})
        else:
            response_text = "❌ Sorry, I couldn't process your voice message. Please try again or send a text message."
            whatsapp_service.send_message(from_phone, response_text)
            return jsonify({'status': 'ok'})
        
    except Exception as e:
        whatsapp_logger.error(f"💥 Error processing WhatsApp voice message from {from_phone}: {str(e)}")
        whatsapp_service.send_message(from_phone, "❌ Sorry, there was an error processing your voice message.")
        return jsonify({'error': str(e)}), 500

def convert_whatsapp_voice_to_text(audio_id):
    """Convert WhatsApp voice message to text using OpenAI Whisper"""
    try:
        # Get access token
        access_token = os.getenv('WHATSAPP_ACCESS_TOKEN')
        if not access_token:
            whatsapp_logger.error("❌ WhatsApp access token not configured")
            return None
            
        # Get media URL from WhatsApp API
        media_url = f"https://graph.facebook.com/v18.0/{audio_id}"
        headers = {"Authorization": f"Bearer {access_token}"}
        
        media_response = requests.get(media_url, headers=headers, timeout=10)
        if media_response.status_code != 200:
            whatsapp_logger.error(f"❌ Failed to get media info: {media_response.status_code}")
            return None
            
        media_info = media_response.json()
        if 'url' not in media_info:
            whatsapp_logger.error(f"❌ No URL in media info: {media_info}")
            return None
            
        # Download the audio file
        audio_url = media_info['url']
        audio_response = requests.get(audio_url, headers=headers, timeout=30)
        if audio_response.status_code != 200:
            whatsapp_logger.error(f"❌ Failed to download audio file: {audio_response.status_code}")
            return None
            
        # Convert to text using OpenAI Whisper
        openai.api_key = os.getenv('OPENAI_API_KEY')
        if not openai.api_key:
            whatsapp_logger.error("❌ OpenAI API key not configured")
            return None
            
        # Create a temporary file for the audio
        import tempfile
        with tempfile.NamedTemporaryFile(suffix='.ogg', delete=False) as temp_file:
            temp_file.write(audio_response.content)
            temp_file_path = temp_file.name
            
        try:
            # Transcribe using OpenAI Whisper (force English)
            with open(temp_file_path, 'rb') as audio_file:
                client = openai.OpenAI(api_key=openai.api_key)
                transcription = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language="en"  # Force English transcription
                )
                
            transcription_text = transcription.text.strip()
            whatsapp_logger.info(f"🎤 Voice transcribed: '{transcription_text}'")
            return transcription_text
            
        finally:
            # Clean up temporary file
            import os as os_module
            try:
                os_module.unlink(temp_file_path)
            except:
                pass
                
    except Exception as e:
        whatsapp_logger.error(f"💥 Error converting WhatsApp voice to text: {str(e)}")
        return None

@whatsapp_bp.route('/whatsapp/webhook', methods=['GET', 'POST'])
def whatsapp_webhook():
    """Handle WhatsApp webhook for incoming messages and verification"""
    try:
        if request.method == 'GET':
            # Webhook verification
            verify_token = request.args.get('hub.verify_token')
            challenge = request.args.get('hub.challenge')
            mode = request.args.get('hub.mode')
            
            if mode == 'subscribe' and whatsapp_service.verify_webhook(verify_token):
                whatsapp_logger.info("WhatsApp webhook verified successfully")
                return challenge, 200
            else:
                whatsapp_logger.warning("WhatsApp webhook verification failed")
                return jsonify({'error': 'Verification failed'}), 403
        
        elif request.method == 'POST':
            # Handle incoming messages
            data = request.get_json()
            whatsapp_logger.info(f"📨 Incoming WhatsApp webhook: {json.dumps(data, indent=2)}")
            
            if not data or 'entry' not in data:
                whatsapp_logger.info("❌ No entry in webhook data")
                return jsonify({'status': 'ok'})
            
            # Process the message
            message_data = messaging_service.process_incoming_message('whatsapp', data)
            
            if not message_data:
                whatsapp_logger.info("❌ Could not process WhatsApp message")
                return jsonify({'status': 'ok'})
            
            from_phone = message_data.get('from_phone')
            message_text = message_data.get('message_text')
            message_type = message_data.get('message_type', 'text')
            
            if not from_phone:
                whatsapp_logger.info("❌ Missing phone number")
                return jsonify({'status': 'ok'})
            
            # Handle voice messages
            if message_type == 'audio' and 'audio_id' in message_data:
                whatsapp_logger.info(f"🎤 Voice message received from {from_phone}")
                return handle_whatsapp_voice_message(message_data, from_phone)
            
            # Handle text messages
            if not message_text:
                whatsapp_logger.info("❌ No text or voice message content")
                return jsonify({'status': 'ok'})
            
            # Find user by WhatsApp phone
            user = User.query.filter_by(whatsapp_phone=from_phone).first()
            
            if not user:
                whatsapp_logger.info(f"❌ No user found with WhatsApp phone: {from_phone}")
                response_text = f"🔐 **Connection Required**\n\nTo use this WhatsApp bot, you need to connect your WhatsApp account to your webapp account.\n\n**Your WhatsApp Phone:** `{from_phone}`\n\n**Steps to connect:**\n1. Go to your webapp: https://d2fq8k5py78ii.cloudfront.net/\n2. Login to your account\n3. Go to Settings tab\n4. Enter your WhatsApp phone: `{from_phone}`\n5. Click 'Connect WhatsApp'\n\nOnce connected, you can use natural language commands like:\n• 'Add contact'\n• 'Show my tasks'\n• 'Find contacts'\n• 'Add task call John tomorrow'"
                
                whatsapp_service.send_message(from_phone, response_text)
                return jsonify({'status': 'ok'})
            
            # Check if user is approved
            if not user.is_approved:
                whatsapp_logger.info(f"❌ User {user.email} is not approved")
                response_text = "🔐 Your account is pending admin approval. Please wait for approval before using the bot."
                whatsapp_service.send_message(from_phone, response_text)
                return jsonify({'status': 'ok'})
            
            # Check for voice approval responses
            if user.state_data and 'pending_voice_transcription' in user.state_data:
                transcription = user.state_data['pending_voice_transcription']
                
                if message_text.lower().strip() in ['yes', 'y', 'approve', 'ok', 'sure', 'yeah', 'yep']:
                    whatsapp_logger.info(f"✅ Voice approved by user {user.email}: '{transcription}'")
                    
                    # Clear the pending transcription
                    user.state_data = None
                    db.session.commit()
                    
                    # Process the approved transcription as a regular text message
                    from routes.telegram import process_natural_language_request
                    
                    class MockTelegramUser:
                        def __init__(self, user):
                            self.telegram_id = user.whatsapp_phone
                            self.first_name = user.full_name or "User"
                            self.current_state = 'idle'
                            self.state_data = None
                    
                    mock_user = MockTelegramUser(user)
                    response_text = process_natural_language_request(transcription, mock_user)
                    
                    whatsapp_service.send_message(from_phone, response_text)
                    return jsonify({'status': 'ok'})
                    
                elif message_text.lower().strip() in ['no', 'n', 'reject', 'ignore', 'nope', 'nah', 'cancel']:
                    whatsapp_logger.info(f"❌ Voice rejected by user {user.email}")
                    
                    # Clear the pending transcription
                    user.state_data = None
                    db.session.commit()
                    
                    response_text = "❌ Voice message ignored."
                    whatsapp_service.send_message(from_phone, response_text)
                    return jsonify({'status': 'ok'})
            
            # Process the message using the same logic as Telegram
            from routes.telegram import process_natural_language_request
            
            # Create a mock telegram_user object for compatibility
            class MockTelegramUser:
                def __init__(self, user):
                    self.telegram_id = user.whatsapp_phone
                    self.first_name = user.full_name or "User"
                    self.current_state = 'idle'
                    self.state_data = None
            
            mock_user = MockTelegramUser(user)
            response_text = process_natural_language_request(message_text, mock_user)
            
            # Send response back to WhatsApp
            whatsapp_service.send_message(from_phone, response_text)
            
            return jsonify({'status': 'ok', 'response': response_text})
            
    except Exception as e:
        whatsapp_logger.error(f"💥 Error processing WhatsApp webhook: {e}", exc_info=True)
        return jsonify({'status': 'error', 'message': str(e)}), 500

@whatsapp_bp.route('/whatsapp/connect', methods=['POST'])
@jwt_required()
def connect_whatsapp():
    """Connect WhatsApp phone number to user account"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        whatsapp_phone = data.get('whatsapp_phone')
        
        if not whatsapp_phone:
            return jsonify({'error': 'WhatsApp phone number is required'}), 400
        
        # Check if phone number is already in use
        existing_user = User.query.filter_by(whatsapp_phone=whatsapp_phone).first()
        if existing_user and existing_user.id != user.id:
            return jsonify({'error': 'WhatsApp phone number already in use'}), 400
        
        # Update user
        user.whatsapp_phone = whatsapp_phone
        user.preferred_messaging_platform = 'whatsapp'
        db.session.commit()
        
        whatsapp_logger.info(f"User {user.email} connected WhatsApp phone: {whatsapp_phone}")
        
        return jsonify({
            'message': 'WhatsApp connected successfully',
            'whatsapp_phone': whatsapp_phone
        })
        
    except Exception as e:
        whatsapp_logger.error(f"Error connecting WhatsApp: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@whatsapp_bp.route('/whatsapp/disconnect', methods=['POST'])
@jwt_required()
def disconnect_whatsapp():
    """Disconnect WhatsApp from user account"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        user.whatsapp_phone = None
        user.preferred_messaging_platform = 'telegram'  # Fallback to telegram
        db.session.commit()
        
        whatsapp_logger.info(f"User {user.email} disconnected WhatsApp")
        
        return jsonify({'message': 'WhatsApp disconnected successfully'})
        
    except Exception as e:
        whatsapp_logger.error(f"Error disconnecting WhatsApp: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@whatsapp_bp.route('/whatsapp/status', methods=['GET'])
@jwt_required()
def whatsapp_status():
    """Check WhatsApp connection status"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        return jsonify({
            'whatsapp_connected': bool(user.whatsapp_phone),
            'whatsapp_phone': user.whatsapp_phone,
            'preferred_platform': user.preferred_messaging_platform
        })
        
    except Exception as e:
        whatsapp_logger.error(f"Error checking WhatsApp status: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500
