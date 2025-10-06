"""
Business Logic Service for User Preferences
Handles preference-specific operations like custom_fields, contact_columns, calendar_settings
"""

from dal.models.user import User
from dal.database import db
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class UserPreferencesService:
    
    @staticmethod
    def get_preference(user_id, preference_name):
        """
        Get a specific preference by user_id and preference_name
        Returns the preference value or None if not found
        """
        try:
            preferences = User.get_user_preferences(user_id)
            if not preferences:
                return None
            
            return preferences.get(preference_name)
        except Exception as e:
            logger.error(f"Error getting preference {preference_name} for user {user_id}: {e}")
            return None
    
    @staticmethod
    def update_preference(user_id, preference_name, preference_value):
        """
        Update a specific preference by user_id and preference_name
        Gets current preferences, updates the specific one, saves back
        """
        try:
            # Get current preferences
            current_preferences = User.get_user_preferences(user_id) or {}
            
            # Update the specific preference
            current_preferences[preference_name] = preference_value
            
            # Save back to database
            success = User.update_user_preferences(user_id, current_preferences)
            
            if success:
                logger.info(f"Updated preference {preference_name} for user {user_id}")
                return True
            else:
                logger.error(f"Failed to update preference {preference_name} for user {user_id}")
                return False
                
        except Exception as e:
            logger.error(f"Error updating preference {preference_name} for user {user_id}: {e}")
            return False
    
    @staticmethod
    def delete_preference(user_id, preference_name):
        """
        Delete a specific preference by user_id and preference_name
        Gets current preferences, removes the specific one, saves back
        """
        try:
            # Get current preferences
            current_preferences = User.get_user_preferences(user_id) or {}
            
            # Remove the specific preference
            if preference_name in current_preferences:
                del current_preferences[preference_name]
                
                # Save back to database
                success = User.update_user_preferences(user_id, current_preferences)
                
                if success:
                    logger.info(f"Deleted preference {preference_name} for user {user_id}")
                    return True
                else:
                    logger.error(f"Failed to delete preference {preference_name} for user {user_id}")
                    return False
            else:
                logger.warning(f"Preference {preference_name} not found for user {user_id}")
                return True  # Already doesn't exist
                
        except Exception as e:
            logger.error(f"Error deleting preference {preference_name} for user {user_id}: {e}")
            return False
    
    @staticmethod
    def insert_preference(user_id, preference_name, preference_value):
        """
        Insert a new preference (same as update_preference)
        """
        return UserPreferencesService.update_preference(user_id, preference_name, preference_value)
    
    @staticmethod
    def delete_all_user_preferences():
        """
        Delete all user preferences for all users
        """
        try:
            count = User.delete_all_user_preferences()
            logger.info(f"Deleted all user preferences for {count} users")
            return count
        except Exception as e:
            logger.error(f"Error deleting all user preferences: {e}")
            return 0
    
    # Convenience methods for specific preferences
    
    @staticmethod
    def get_custom_fields(user_id):
        """Get custom_fields preference for user"""
        return UserPreferencesService.get_preference(user_id, 'custom_fields') or []
    
    @staticmethod
    def update_custom_fields(user_id, custom_fields_list):
        """Update custom_fields preference for user"""
        return UserPreferencesService.update_preference(user_id, 'custom_fields', custom_fields_list)
    
    @staticmethod
    def get_contact_columns(user_id):
        """Get contact_columns preference for user"""
        return UserPreferencesService.get_preference(user_id, 'contact_columns') or []
    
    @staticmethod
    def update_contact_columns(user_id, contact_columns_list):
        """Update contact_columns preference for user"""
        return UserPreferencesService.update_preference(user_id, 'contact_columns', contact_columns_list)
    
    @staticmethod
    def get_calendar_settings(user_id):
        """Get calendar_settings preference for user"""
        return UserPreferencesService.get_preference(user_id, 'calendar_settings') or {
            'default_view': 'monthly',
            'start_weekday': 'sunday'
        }
    
    @staticmethod
    def update_calendar_settings(user_id, calendar_settings_dict):
        """Update calendar_settings preference for user"""
        return UserPreferencesService.update_preference(user_id, 'calendar_settings', calendar_settings_dict)
