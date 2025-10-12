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
    
    # Plan management methods
    
    @staticmethod
    def get_user_plan(user_id):
        """Get user plan preference"""
        return UserPreferencesService.get_preference(user_id, 'plan') or 'Starter'
    
    @staticmethod
    def update_user_plan(user_id, plan):
        """Update user plan preference"""
        valid_plans = ['Starter', 'Pro', 'Business']
        if plan not in valid_plans:
            logger.error(f"Invalid plan '{plan}' for user {user_id}. Valid plans: {valid_plans}")
            return False
        return UserPreferencesService.update_preference(user_id, 'plan', plan)
    
    @staticmethod
    def get_plan_details(plan):
        """Get plan details including product IDs and features"""
        plan_details = {
            'Starter': {
                'name': 'Starter',
                'product_id': 'prod_TBBYLl1MBmQJ2d',
                'tax_code': 'Marketing Services',
                'tax_code_id': 'txcd_20060055',
                'description': '1 WhatsApp/Telegram workspace\nCore: chat-based task management, automatic reminders, basic STT→action (as it ships), CRM-in-chat, Google Calendar integration (as it ships).\nLimits: ~200 voice actions/mo, 500 tasks/mo, 5 GB storage.\nSupport: email (48h)',
                'features': [
                    '1 WhatsApp/Telegram workspace',
                    'Chat-based task management',
                    'Automatic reminders',
                    'Basic STT→action',
                    'CRM-in-chat',
                    'Google Calendar integration',
                    '200 voice actions/month',
                    '500 tasks/month',
                    '5 GB storage',
                    'Email support (48h)'
                ]
            },
            'Pro': {
                'name': 'Pro',
                'product_id': 'prod_TBBYP7nEOaevlJ',
                'tax_code': 'Marketing Services',
                'tax_code_id': 'txcd_20060055',
                'description': 'Everything in Starter + meeting summaries from voice/transcripts, team collaboration in WhatsApp groups, email → actions + weekly email summaries\nLimits: ~1,000 voice actions/mo, 5,000 tasks/mo, 25 GB storage.\nSupport: priority email (24h)',
                'features': [
                    'Everything in Starter',
                    'Meeting summaries from voice/transcripts',
                    'Team collaboration in WhatsApp groups',
                    'Email → actions',
                    'Weekly email summaries',
                    '1,000 voice actions/month',
                    '5,000 tasks/month',
                    '25 GB storage',
                    'Priority email support (24h)'
                ]
            },
            'Business': {
                'name': 'Business',
                'product_id': 'prod_TBBZfboYKzrWxH',
                'tax_code': 'Marketing Services',
                'tax_code_id': 'txcd_20060055',
                'description': 'Everything in Pro + advanced team/roles, agent joins client groups to flag hot leads/issues (when released), security & role-based access\nLimits: ~5,000 voice actions/mo, 20,000 tasks/mo, 100 GB storage\nSupport: email + chat (8h)',
                'features': [
                    'Everything in Pro',
                    'Advanced team/roles',
                    'Agent joins client groups',
                    'Flag hot leads/issues',
                    'Security & role-based access',
                    '5,000 voice actions/month',
                    '20,000 tasks/month',
                    '100 GB storage',
                    'Email + chat support (8h)'
                ]
            }
        }
        return plan_details.get(plan, plan_details['Starter'])
