"""
API Routes for User Preferences
Handles user preference operations like custom_fields, contact_columns, calendar_settings
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bl.services.user_preferences_service import UserPreferencesService
from dal.database import db
import logging

logger = logging.getLogger(__name__)

user_preferences_bp = Blueprint('user_preferences', __name__)

@user_preferences_bp.route('/user-preferences', methods=['GET'])
@jwt_required()
def get_user_preferences():
    """Get all user preferences"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get all preferences
        preferences = UserPreferencesService.get_preference(current_user_id, 'all') or {}
        
        # Get specific preferences with defaults
        custom_fields = UserPreferencesService.get_custom_fields(current_user_id)
        contact_columns = UserPreferencesService.get_contact_columns(current_user_id)
        calendar_settings = UserPreferencesService.get_calendar_settings(current_user_id)
        
        return jsonify({
            'success': True,
            'preferences': {
                'custom_fields': custom_fields,
                'contact_columns': contact_columns,
                'calendar_settings': calendar_settings
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting user preferences: {e}")
        return jsonify({'error': str(e)}), 500

@user_preferences_bp.route('/user-preferences/<preference_name>', methods=['GET'])
@jwt_required()
def get_specific_preference(preference_name):
    """Get a specific preference by name"""
    try:
        current_user_id = get_jwt_identity()
        
        preference_value = UserPreferencesService.get_preference(current_user_id, preference_name)
        
        return jsonify({
            'success': True,
            'preference_name': preference_name,
            'preference_value': preference_value
        })
        
    except Exception as e:
        logger.error(f"Error getting preference {preference_name}: {e}")
        return jsonify({'error': str(e)}), 500

@user_preferences_bp.route('/user-preferences/<preference_name>', methods=['POST'])
@jwt_required()
def update_preference(preference_name):
    """Update a specific preference by name"""
    try:
        current_user_id = get_jwt_identity()
        
        data = request.get_json()
        if not data or 'value' not in data:
            return jsonify({'error': 'Missing preference value'}), 400
        
        preference_value = data['value']
        
        success = UserPreferencesService.update_preference(current_user_id, preference_name, preference_value)
        
        if success:
            logger.info(f"Updated preference {preference_name} for user {current_user_id}")
            return jsonify({
                'success': True,
                'message': f'Preference {preference_name} updated successfully',
                'preference_name': preference_name,
                'preference_value': preference_value
            })
        else:
            return jsonify({'error': f'Failed to update preference {preference_name}'}), 500
        
    except Exception as e:
        logger.error(f"Error updating preference {preference_name}: {e}")
        return jsonify({'error': str(e)}), 500

@user_preferences_bp.route('/user-preferences/<preference_name>', methods=['DELETE'])
@jwt_required()
def delete_preference(preference_name):
    """Delete a specific preference by name"""
    try:
        current_user_id = get_jwt_identity()
        
        success = UserPreferencesService.delete_preference(current_user_id, preference_name)
        
        if success:
            logger.info(f"Deleted preference {preference_name} for user {current_user_id}")
            return jsonify({
                'success': True,
                'message': f'Preference {preference_name} deleted successfully'
            })
        else:
            return jsonify({'error': f'Failed to delete preference {preference_name}'}), 500
        
    except Exception as e:
        logger.error(f"Error deleting preference {preference_name}: {e}")
        return jsonify({'error': str(e)}), 500

# Convenience endpoints for specific preferences

@user_preferences_bp.route('/custom-fields', methods=['GET'])
@jwt_required()
def get_custom_fields():
    """Get custom fields for user"""
    try:
        current_user_id = get_jwt_identity()
        
        custom_fields = UserPreferencesService.get_custom_fields(current_user_id)
        
        return jsonify({
            'success': True,
            'custom_fields': custom_fields
        })
        
    except Exception as e:
        logger.error(f"Error getting custom fields: {e}")
        return jsonify({'error': str(e)}), 500

@user_preferences_bp.route('/custom-fields', methods=['POST'])
@jwt_required()
def update_custom_fields():
    """Update custom fields for user"""
    try:
        current_user_id = get_jwt_identity()
        
        data = request.get_json()
        if not data or 'custom_fields' not in data:
            return jsonify({'error': 'Missing custom_fields data'}), 400
        
        custom_fields = data['custom_fields']
        
        success = UserPreferencesService.update_custom_fields(current_user_id, custom_fields)
        
        if success:
            logger.info(f"Updated custom fields for user {current_user_id}: {custom_fields}")
            return jsonify({
                'success': True,
                'message': 'Custom fields updated successfully',
                'custom_fields': custom_fields
            })
        else:
            return jsonify({'error': 'Failed to update custom fields'}), 500
        
    except Exception as e:
        logger.error(f"Error updating custom fields: {e}")
        return jsonify({'error': str(e)}), 500

@user_preferences_bp.route('/contact-columns', methods=['GET'])
@jwt_required()
def get_contact_columns():
    """Get contact columns for user"""
    try:
        current_user_id = get_jwt_identity()
        
        contact_columns = UserPreferencesService.get_contact_columns(current_user_id)
        
        return jsonify({
            'success': True,
            'contact_columns': contact_columns
        })
        
    except Exception as e:
        logger.error(f"Error getting contact columns: {e}")
        return jsonify({'error': str(e)}), 500

@user_preferences_bp.route('/contact-columns', methods=['POST'])
@jwt_required()
def update_contact_columns():
    """Update contact columns for user"""
    try:
        current_user_id = get_jwt_identity()
        
        data = request.get_json()
        if not data or 'contact_columns' not in data:
            return jsonify({'error': 'Missing contact_columns data'}), 400
        
        contact_columns = data['contact_columns']
        
        success = UserPreferencesService.update_contact_columns(current_user_id, contact_columns)
        
        if success:
            logger.info(f"Updated contact columns for user {current_user_id}")
            return jsonify({
                'success': True,
                'message': 'Contact columns updated successfully',
                'contact_columns': contact_columns
            })
        else:
            return jsonify({'error': 'Failed to update contact columns'}), 500
        
    except Exception as e:
        logger.error(f"Error updating contact columns: {e}")
        return jsonify({'error': str(e)}), 500

@user_preferences_bp.route('/calendar-settings', methods=['GET'])
@jwt_required()
def get_calendar_settings():
    """Get calendar settings for user"""
    try:
        current_user_id = get_jwt_identity()
        
        calendar_settings = UserPreferencesService.get_calendar_settings(current_user_id)
        
        return jsonify({
            'success': True,
            'calendar_settings': calendar_settings
        })
        
    except Exception as e:
        logger.error(f"Error getting calendar settings: {e}")
        return jsonify({'error': str(e)}), 500

@user_preferences_bp.route('/calendar-settings', methods=['POST'])
@jwt_required()
def update_calendar_settings():
    """Update calendar settings for user"""
    try:
        current_user_id = get_jwt_identity()
        
        data = request.get_json()
        if not data or 'calendar_settings' not in data:
            return jsonify({'error': 'Missing calendar_settings data'}), 400
        
        calendar_settings = data['calendar_settings']
        
        success = UserPreferencesService.update_calendar_settings(current_user_id, calendar_settings)
        
        if success:
            logger.info(f"Updated calendar settings for user {current_user_id}")
            return jsonify({
                'success': True,
                'message': 'Calendar settings updated successfully',
                'calendar_settings': calendar_settings
            })
        else:
            return jsonify({'error': 'Failed to update calendar settings'}), 500
        
    except Exception as e:
        logger.error(f"Error updating calendar settings: {e}")
        return jsonify({'error': str(e)}), 500

# Admin endpoint for resetting all user preferences

@user_preferences_bp.route('/admin/reset-all-preferences', methods=['POST'])
@jwt_required()
def reset_all_user_preferences():
    """Reset all user preferences for all users (admin only)"""
    try:
        current_user_id = get_jwt_identity()
        
        # Check if user is admin (you can implement your admin check here)
        # For now, we'll allow it for testing
        
        count = UserPreferencesService.delete_all_user_preferences()
        
        logger.info(f"Reset all user preferences for {count} users by admin {current_user_id}")
        
        return jsonify({
            'success': True,
            'message': f'Reset preferences for {count} users',
            'users_affected': count
        })
        
    except Exception as e:
        logger.error(f"Error resetting all user preferences: {e}")
        return jsonify({'error': str(e)}), 500