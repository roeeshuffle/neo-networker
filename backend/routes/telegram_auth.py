from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import TelegramUser, User
from database import db
from datetime import datetime
import uuid
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
telegram_auth_logger = logging.getLogger('telegram_auth')

telegram_auth_bp = Blueprint('telegram_auth', __name__)

@telegram_auth_bp.route('/telegram/connect', methods=['POST'])
@jwt_required()
def connect_telegram():
    """Connect a Telegram user to the current webapp user"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user or not current_user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        telegram_id = data.get('telegram_id')
        
        if not telegram_id:
            return jsonify({'error': 'Telegram ID is required'}), 400
        
        # Check if this Telegram ID is already connected to another user
        existing_telegram_user = TelegramUser.query.filter_by(telegram_id=telegram_id).first()
        
        if existing_telegram_user:
            if existing_telegram_user.user_id == current_user_id:
                # Already connected to this user
                return jsonify({
                    'message': 'Telegram account already connected',
                    'telegram_user': existing_telegram_user.to_dict()
                })
            else:
                # Connected to a different user
                return jsonify({'error': 'This Telegram account is already connected to another user'}), 400
        
        # Create new Telegram user connection
        telegram_user = TelegramUser(
            id=str(uuid.uuid4()),
            telegram_id=telegram_id,
            telegram_username=data.get('telegram_username', 'Unknown'),
            first_name=data.get('first_name', 'Unknown'),
            user_id=current_user_id,
            is_authenticated=True,
            authenticated_at=datetime.utcnow(),
            current_state='idle'
        )
        
        db.session.add(telegram_user)
        db.session.commit()
        
        telegram_auth_logger.info(f"✅ Connected Telegram user {telegram_id} to user {current_user.email}")
        
        return jsonify({
            'message': 'Telegram account connected successfully',
            'telegram_user': telegram_user.to_dict()
        })
        
    except Exception as e:
        telegram_auth_logger.error(f"💥 Error connecting Telegram: {e}")
        return jsonify({'error': str(e)}), 500

@telegram_auth_bp.route('/telegram/disconnect', methods=['POST'])
@jwt_required()
def disconnect_telegram():
    """Disconnect Telegram from the current webapp user"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user or not current_user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Find Telegram user connected to this account
        telegram_user = TelegramUser.query.filter_by(user_id=current_user_id).first()
        
        if not telegram_user:
            return jsonify({'error': 'No Telegram account connected'}), 404
        
        # Store the telegram_id before deleting
        old_telegram_id = telegram_user.telegram_id
        
        # Delete the entire TelegramUser record to allow reconnection with same ID
        db.session.delete(telegram_user)
        db.session.commit()
        
        telegram_auth_logger.info(f"✅ Deleted Telegram user {old_telegram_id} from user {current_user.email}")
        
        return jsonify({'message': f'Telegram account {old_telegram_id} disconnected successfully'})
        
    except Exception as e:
        telegram_auth_logger.error(f"💥 Error disconnecting Telegram: {e}")
        return jsonify({'error': str(e)}), 500

@telegram_auth_bp.route('/telegram/status', methods=['GET'])
@jwt_required()
def get_telegram_status():
    """Get Telegram connection status for current user"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user or not current_user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Find Telegram user connected to this account
        telegram_user = TelegramUser.query.filter_by(user_id=current_user_id).first()
        
        if telegram_user:
            return jsonify({
                'connected': True,
                'telegram_user': telegram_user.to_dict()
            })
        else:
            return jsonify({
                'connected': False,
                'telegram_user': None
            })
        
    except Exception as e:
        telegram_auth_logger.error(f"💥 Error getting Telegram status: {e}")
        return jsonify({'error': str(e)}), 500
