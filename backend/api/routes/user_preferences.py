from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from dal.models import User
from dal.database import db
import logging

logger = logging.getLogger(__name__)

user_preferences_bp = Blueprint('user_preferences', __name__)

@user_preferences_bp.route('/api/user/preferences', methods=['GET'])
@jwt_required()
def get_user_preferences():
    """Get user preferences"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Return user preferences or default values
        preferences = user.user_preferences or {}
        
        # Set default values if not present
        default_preferences = {
            'calendar': {
                'defaultView': 'monthly',
                'startWeekday': 'sunday'
            },
            'theme': {
                'mode': 'light'
            },
            'notifications': {
                'email': True,
                'push': True
            }
        }
        
        # Merge with defaults
        for category, settings in default_preferences.items():
            if category not in preferences:
                preferences[category] = settings
            else:
                for key, value in settings.items():
                    if key not in preferences[category]:
                        preferences[category][key] = value
        
        return jsonify({
            'success': True,
            'preferences': preferences
        })
        
    except Exception as e:
        logger.error(f"Error getting user preferences: {str(e)}")
        return jsonify({'error': 'Failed to get user preferences'}), 500

@user_preferences_bp.route('/api/user/preferences', methods=['POST'])
@jwt_required()
def update_user_preferences():
    """Update user preferences"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Get current preferences or initialize empty dict
        current_preferences = user.user_preferences or {}
        
        # Update specific category
        category = data.get('category')
        settings = data.get('settings', {})
        
        if not category:
            return jsonify({'error': 'Category is required'}), 400
        
        # Update the specific category
        current_preferences[category] = settings
        
        # Save to database
        user.user_preferences = current_preferences
        user.updated_at = db.func.now()
        db.session.commit()
        
        logger.info(f"Updated {category} preferences for user {user.id}")
        
        return jsonify({
            'success': True,
            'message': f'{category} preferences updated successfully',
            'preferences': current_preferences
        })
        
    except Exception as e:
        logger.error(f"Error updating user preferences: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to update user preferences'}), 500

@user_preferences_bp.route('/api/user/preferences/<category>', methods=['GET'])
@jwt_required()
def get_category_preferences(category):
    """Get preferences for a specific category"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        preferences = user.user_preferences or {}
        category_preferences = preferences.get(category, {})
        
        # Set default values for specific categories
        defaults = {
            'calendar': {
                'defaultView': 'monthly',
                'startWeekday': 'sunday'
            },
            'theme': {
                'mode': 'light'
            },
            'notifications': {
                'email': True,
                'push': True
            }
        }
        
        # Merge with defaults
        default_values = defaults.get(category, {})
        for key, value in default_values.items():
            if key not in category_preferences:
                category_preferences[key] = value
        
        return jsonify({
            'success': True,
            'category': category,
            'preferences': category_preferences
        })
        
    except Exception as e:
        logger.error(f"Error getting {category} preferences: {str(e)}")
        return jsonify({'error': f'Failed to get {category} preferences'}), 500
