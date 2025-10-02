from flask import Blueprint, request, jsonify, redirect
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from bl.services.google_auth_service import GoogleAuthService
from dal.models import User
from dal.database import db
from datetime import datetime
import logging
import uuid
import os

logger = logging.getLogger(__name__)
google_auth_bp = Blueprint('google_auth', __name__)

# Initialize Google Auth Service
try:
    google_auth_service = GoogleAuthService()
except ValueError as e:
    logger.warning(f"Google Auth not configured: {str(e)}")
    google_auth_service = None

@google_auth_bp.route('/auth/google', methods=['GET'])
def google_auth_initiate():
    """Initiate Google OAuth flow"""
    if not google_auth_service:
        return jsonify({'error': 'Google OAuth not configured'}), 500
    
    try:
        # Generate state parameter for security
        state = str(uuid.uuid4())
        
        # Store state in session or database for validation
        # For now, we'll include it in the redirect URL
        # Generate authorization URL with backend callback
        authorization_url = google_auth_service.get_authorization_url(state=state)
        
        return jsonify({
            'authorization_url': authorization_url,
            'state': state
        })
    except Exception as e:
        logger.error(f"Error initiating Google auth: {str(e)}")
        return jsonify({'error': 'Failed to initiate Google authentication'}), 500

@google_auth_bp.route('/auth/google/callback', methods=['GET'])
def google_auth_callback():
    """Handle Google OAuth callback"""
    if not google_auth_service:
        return jsonify({'error': 'Google OAuth not configured'}), 500
    
    try:
        code = request.args.get('code')
        state = request.args.get('state')
        error = request.args.get('error')
        
        if error:
            return jsonify({'error': f'Google OAuth error: {error}'}), 400
        
        if not code:
            return jsonify({'error': 'Authorization code not provided'}), 400
        
        # Exchange code for tokens
        tokens = google_auth_service.exchange_code_for_tokens(code, state)
        
        # Get user info from Google
        user_info = google_auth_service.get_user_info(tokens['access_token'])
        
        # Create or update user
        user = google_auth_service.create_or_update_user(user_info, tokens)
        
        # Auto-sync Google data after successful authentication
        try:
            logger.info(f"Auto-syncing Google data for user {user.id}")
            
            # Sync contacts
            contacts_synced = google_auth_service.sync_contacts(user)
            logger.info(f"Auto-synced {contacts_synced} contacts for user {user.id}")
            
            # Sync calendar events
            events_synced = google_auth_service.sync_calendar_events(user)
            logger.info(f"Auto-synced {events_synced} events for user {user.id}")
            
            # Update sync timestamps
            user.google_contacts_synced_at = datetime.utcnow()
            user.google_calendar_synced_at = datetime.utcnow()
            db.session.commit()
            
        except Exception as sync_error:
            logger.warning(f"Auto-sync failed for user {user.id}: {str(sync_error)}")
            # Don't fail the authentication if sync fails
        
        # Create JWT token
        access_token = create_access_token(identity=user.id)
        
        # Redirect to frontend with success and token
        frontend_url = "https://d2fq8k5py78ii.cloudfront.net/auth/google/callback"
        redirect_url = f"{frontend_url}?success=true&token={access_token}"
        
        return redirect(redirect_url)
        
    except Exception as e:
        logger.error(f"Error in Google auth callback: {str(e)}")
        return jsonify({'error': 'Google authentication failed'}), 500

@google_auth_bp.route('/auth/google/link', methods=['POST'])
@jwt_required()
def google_auth_link():
    """Link Google account to existing user"""
    if not google_auth_service:
        return jsonify({'error': 'Google OAuth not configured'}), 500
    
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        code = data.get('code')
        state = data.get('state')
        
        if not code:
            return jsonify({'error': 'Authorization code not provided'}), 400
        
        # Exchange code for tokens
        tokens = google_auth_service.exchange_code_for_tokens(code, state)
        
        # Get user info from Google
        user_info = google_auth_service.get_user_info(tokens['access_token'])
        
        # Check if email matches
        if user_info['email'] != user.email:
            return jsonify({'error': 'Google account email does not match your account email'}), 400
        
        # Check if Google account is already linked to another user
        existing_google_user = User.query.filter_by(google_id=user_info['google_id']).first()
        if existing_google_user and existing_google_user.id != user.id:
            return jsonify({'error': 'This Google account is already linked to another user'}), 400
        
        # Link Google account
        user.google_id = user_info['google_id']
        user.google_access_token = tokens['access_token']
        user.google_refresh_token = tokens['refresh_token']
        if tokens.get('expires_at'):
            user.google_token_expires_at = datetime.fromisoformat(tokens['expires_at'].replace('Z', '+00:00'))
        
        if not user.avatar_url and user_info.get('picture'):
            user.avatar_url = user_info['picture']
        
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Google account linked successfully',
            'user': user.to_dict()
        })
        
    except Exception as e:
        logger.error(f"Error linking Google account: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to link Google account'}), 500

@google_auth_bp.route('/auth/google/revoke', methods=['POST'])
@jwt_required()
def google_auth_revoke():
    """Revoke Google access and unlink account"""
    if not google_auth_service:
        return jsonify({'error': 'Google OAuth not configured'}), 500
    
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.google_id:
            return jsonify({'error': 'No Google account linked'}), 400
        
        # Revoke tokens
        if user.google_access_token:
            google_auth_service.revoke_tokens(
                user.google_access_token, 
                user.google_refresh_token
            )
        
        # Clear Google data
        user.google_id = None
        user.google_access_token = None
        user.google_refresh_token = None
        user.google_token_expires_at = None
        user.google_contacts_synced_at = None
        user.google_calendar_synced_at = None
        user.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Google account unlinked successfully',
            'user': user.to_dict()
        })
        
    except Exception as e:
        logger.error(f"Error revoking Google access: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to revoke Google access'}), 500

@google_auth_bp.route('/auth/google/contacts', methods=['GET'])
@jwt_required()
def get_google_contacts():
    """Get Google contacts for the current user"""
    if not google_auth_service:
        return jsonify({'error': 'Google OAuth not configured'}), 500
    
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.google_id:
            return jsonify({'error': 'No Google account linked'}), 400
        
        # Ensure valid token
        access_token = google_auth_service.ensure_valid_token(user)
        
        # Get contacts
        max_results = request.args.get('max_results', 1000, type=int)
        contacts = google_auth_service.get_contacts(access_token, max_results)
        
        # Update sync timestamp
        user.google_contacts_synced_at = datetime.utcnow()
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'contacts': contacts,
            'count': len(contacts),
            'synced_at': user.google_contacts_synced_at.isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting Google contacts: {str(e)}")
        return jsonify({'error': 'Failed to get Google contacts'}), 500

@google_auth_bp.route('/auth/google/calendar', methods=['GET'])
@jwt_required()
def get_google_calendar():
    """Get Google calendar events for the current user"""
    if not google_auth_service:
        return jsonify({'error': 'Google OAuth not configured'}), 500
    
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.google_id:
            return jsonify({'error': 'No Google account linked'}), 400
        
        # Ensure valid token
        access_token = google_auth_service.ensure_valid_token(user)
        
        # Get calendar events
        max_results = request.args.get('max_results', 100, type=int)
        time_min = request.args.get('time_min')
        time_max = request.args.get('time_max')
        
        events = google_auth_service.get_calendar_events(
            access_token, 
            max_results, 
            time_min, 
            time_max
        )
        
        # Update sync timestamp
        user.google_calendar_synced_at = datetime.utcnow()
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'events': events,
            'count': len(events),
            'synced_at': user.google_calendar_synced_at.isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error getting Google calendar: {str(e)}")
        return jsonify({'error': 'Failed to get Google calendar events'}), 500

@google_auth_bp.route('/auth/google/status', methods=['GET'])
def google_auth_status():
    """Get Google authentication status for current user"""
    try:
        # Check if user is authenticated
        try:
            from flask_jwt_extended import verify_jwt_in_request
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)
            
            if not user:
                return jsonify({'error': 'User not found', 'authenticated': False}), 404
        except Exception as auth_error:
            # JWT authentication failed - return JSON instead of HTML
            # This is expected when called from auth page, so don't log as warning
            return jsonify({
                'error': 'Authentication required',
                'authenticated': False,
                'has_google_account': False,
                'google_id': None,
                'token_valid': False,
                'contacts_synced_at': None,
                'calendar_synced_at': None,
                'service_configured': False
            }), 401
        
        has_google = bool(user.google_id)
        token_valid = False
        
        # Check if Google Auth service is available
        if not google_auth_service:
            return jsonify({
                'has_google_account': False,
                'google_id': None,
                'token_valid': False,
                'contacts_synced_at': None,
                'calendar_synced_at': None,
                'service_configured': False,
                'authenticated': True
            })
        
        if has_google:
            token_valid = google_auth_service.is_token_valid(user)
        
        return jsonify({
            'has_google_account': has_google,
            'google_id': user.google_id,
            'token_valid': token_valid,
            'contacts_synced_at': user.google_contacts_synced_at.isoformat() if user.google_contacts_synced_at else None,
            'calendar_synced_at': user.google_calendar_synced_at.isoformat() if user.google_calendar_synced_at else None,
            'service_configured': True,
            'authenticated': True
        })
        
@google_auth_bp.route('/auth/google/sync-contacts', methods=['POST'])
def sync_google_contacts():
    """Sync Google contacts to the database"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if not user.google_id:
            return jsonify({'error': 'Google account not connected'}), 400
        
        # Sync contacts
        contacts_synced = google_auth_service.sync_contacts(user)
        
        # Update sync timestamp
        user.google_contacts_synced_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'contacts_synced': contacts_synced,
            'message': f'Successfully synced {contacts_synced} contacts'
        })
        
    except Exception as e:
        logger.error(f"Error syncing Google contacts: {str(e)}")
        return jsonify({'error': 'Failed to sync contacts'}), 500

@google_auth_bp.route('/auth/google/sync-calendar', methods=['POST'])
def sync_google_calendar():
    """Sync Google calendar events to the database"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if not user.google_id:
            return jsonify({'error': 'Google account not connected'}), 400
        
        # Sync calendar events
        events_synced = google_auth_service.sync_calendar_events(user)
        
        # Update sync timestamp
        user.google_calendar_synced_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'events_synced': events_synced,
            'message': f'Successfully synced {events_synced} calendar events'
        })
        
    except Exception as e:
        logger.error(f"Error syncing Google calendar: {str(e)}")
        return jsonify({'error': 'Failed to sync calendar events'}), 500
