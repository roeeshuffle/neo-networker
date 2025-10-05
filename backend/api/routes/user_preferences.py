from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from dal.models import User
from dal.database import db
import logging

user_preferences_bp = Blueprint('user_preferences', __name__)
user_preferences_logger = logging.getLogger('user_preferences')

@user_preferences_bp.route('/user-preferences', methods=['GET'])
@jwt_required()
def get_user_preferences():
    """Get user preferences"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        preferences = user.user_preferences or {}
        
        user_preferences_logger.info(f"🔍 USER PREFS GET: User {user.email}")
        user_preferences_logger.info(f"🔍 USER PREFS GET: Preferences: {preferences}")
        
        return jsonify({
            'success': True,
            'preferences': preferences
        })
        
    except Exception as e:
        user_preferences_logger.error(f"Error getting user preferences: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@user_preferences_bp.route('/user-preferences', methods=['POST'])
@jwt_required()
def save_user_preferences():
    """Save user preferences"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        user_preferences_logger.info(f"🔍 USER PREFS SAVE: User {user.email}")
        user_preferences_logger.info(f"🔍 USER PREFS SAVE: Data: {data}")
        
        # Initialize user preferences if not exists
        if not user.user_preferences:
            user.user_preferences = {}
        
        # Update specific preference fields
        for key, value in data.items():
            user.user_preferences[key] = value
        
        db.session.commit()
        
        user_preferences_logger.info(f"🔍 USER PREFS SAVE: Updated preferences: {user.user_preferences}")
        
        return jsonify({
            'success': True,
            'message': 'User preferences saved successfully',
            'preferences': user.user_preferences
        })
        
    except Exception as e:
        user_preferences_logger.error(f"Error saving user preferences: {e}", exc_info=True)
        db.session.rollback()
        return jsonify({'error': str(e)}), 500