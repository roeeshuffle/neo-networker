from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from dal.models import User
from dal.database import db
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
        existing_user = User.query.filter_by(telegram_id=telegram_id).first()
        
        if existing_user:
            if existing_user.id == current_user_id:
                # Already connected to this user
                return jsonify({
                    'message': 'Telegram account already connected',
                    'user': existing_user.to_dict()
                })
            else:
                # Connected to a different user
                return jsonify({'error': 'This Telegram account is already connected to another user'}), 400
        
        # Update current user with Telegram ID
        current_user.telegram_id = telegram_id
        current_user.telegram_username = data.get('telegram_username', 'Unknown')
        
        db.session.commit()
        
        telegram_auth_logger.info(f"✅ Connected Telegram user {telegram_id} to user {current_user.email}")
        
        return jsonify({
            'message': 'Telegram account connected successfully',
            'user': current_user.to_dict()
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
        
        # Check if user has Telegram connected
        if not current_user.telegram_id:
            return jsonify({'error': 'No Telegram account connected'}), 404
        
        # Store the telegram_id before clearing
        old_telegram_id = current_user.telegram_id
        
        # Clear Telegram connection
        current_user.telegram_id = None
        current_user.telegram_username = None
        db.session.commit()
        
        telegram_auth_logger.info(f"✅ Disconnected Telegram user {old_telegram_id} from user {current_user.email}")
        
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
        
        # Check if user has Telegram connected
        if current_user.telegram_id:
            return jsonify({
                'connected': True,
                'telegram_user': {
                    'id': current_user.id,
                    'telegram_id': current_user.telegram_id,
                    'telegram_username': current_user.telegram_username,
                    'first_name': current_user.full_name
                }
            })
        else:
            return jsonify({
                'connected': False,
                'telegram_user': None
            })
        
    except Exception as e:
        telegram_auth_logger.error(f"💥 Error getting Telegram status: {e}")
        return jsonify({'error': str(e)}), 500
