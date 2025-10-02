import os
import json
import uuid
import logging
from datetime import datetime, timedelta
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from dal.models import User
from dal.database import db

# Suppress Google API client cache warnings
import warnings
warnings.filterwarnings("ignore", message="file_cache is only supported with oauth2client<4.0.0")

logger = logging.getLogger(__name__)

class GoogleAuthService:
    # OAuth 2.0 scopes
    SCOPES = [
        'openid',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/contacts.readonly',
        'https://www.googleapis.com/auth/calendar.readonly'
    ]
    
    def __init__(self):
        self.client_id = os.getenv('GOOGLE_CLIENT_ID')
        self.client_secret = os.getenv('GOOGLE_CLIENT_SECRET')
        self.redirect_uri = os.getenv('GOOGLE_REDIRECT_URI', 'https://dkdrn34xpx.us-east-1.awsapprunner.com/api/auth/google/callback')
        
        self.enabled = all([self.client_id, self.client_secret, self.redirect_uri])
        if not self.enabled:
            logger.warning("Google OAuth credentials not configured - Google Auth disabled")
            # Don't raise an error, just disable the service
    
    def get_authorization_url(self, state=None):
        """Generate Google OAuth authorization URL"""
        if not self.enabled:
            raise ValueError("Google OAuth is not configured")
        try:
            flow = Flow.from_client_config(
                {
                    "web": {
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                        "redirect_uris": [self.redirect_uri]
                    }
                },
                scopes=self.SCOPES
            )
            flow.redirect_uri = self.redirect_uri
            
            if state:
                flow.state = state
                
            authorization_url, _ = flow.authorization_url(
                access_type='offline',
                include_granted_scopes='true',
                prompt='consent'
            )
            
            return authorization_url
        except Exception as e:
            logger.error(f"Error generating authorization URL: {str(e)}")
            raise
    
    def exchange_code_for_tokens(self, authorization_code, state=None):
        """Exchange authorization code for access and refresh tokens"""
        if not self.enabled:
            raise ValueError("Google OAuth is not configured")
        
        try:
            logger.info(f"Exchanging authorization code for tokens. Code length: {len(authorization_code) if authorization_code else 0}")
            logger.info(f"Using redirect URI: {self.redirect_uri}")
            
            flow = Flow.from_client_config(
                {
                    "web": {
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                        "redirect_uris": [self.redirect_uri]
                    }
                },
                scopes=self.SCOPES
            )
            flow.redirect_uri = self.redirect_uri
            
            if state:
                flow.state = state
                logger.info(f"Using state parameter: {state}")
                
            flow.fetch_token(code=authorization_code)
            
            credentials = flow.credentials
            
            logger.info("Successfully exchanged code for tokens")
            
            return {
                'access_token': credentials.token,
                'refresh_token': credentials.refresh_token,
                'expires_at': credentials.expiry.isoformat() if credentials.expiry else None,
                'scopes': credentials.scopes
            }
        except Exception as e:
            logger.error(f"Error exchanging code for tokens: {str(e)}")
            logger.error(f"Authorization code: {authorization_code[:20]}..." if authorization_code else "No authorization code")
            logger.error(f"State: {state}")
            raise
    
    def get_user_info(self, access_token):
        """Get user information from Google"""
        try:
            credentials = Credentials(token=access_token)
            service = build('oauth2', 'v2', credentials=credentials)
            user_info = service.userinfo().get().execute()
            
            return {
                'google_id': user_info.get('id'),
                'email': user_info.get('email'),
                'name': user_info.get('name'),
                'picture': user_info.get('picture'),
                'verified_email': user_info.get('verified_email', False)
            }
        except HttpError as e:
            logger.error(f"Error getting user info: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error getting user info: {str(e)}")
            raise
    
    def refresh_access_token(self, refresh_token):
        """Refresh expired access token"""
        try:
            credentials = Credentials(
                token=None,
                refresh_token=refresh_token,
                token_uri="https://oauth2.googleapis.com/token",
                client_id=self.client_id,
                client_secret=self.client_secret
            )
            
            credentials.refresh(Request())
            
            return {
                'access_token': credentials.token,
                'expires_at': credentials.expiry.isoformat() if credentials.expiry else None
            }
        except Exception as e:
            logger.error(f"Error refreshing access token: {str(e)}")
            raise
    
    def revoke_tokens(self, access_token, refresh_token=None):
        """Revoke access and refresh tokens"""
        try:
            credentials = Credentials(token=access_token)
            credentials.revoke(Request())
            
            if refresh_token:
                # Also revoke refresh token
                revoke_url = f"https://oauth2.googleapis.com/revoke?token={refresh_token}"
                import requests
                requests.post(revoke_url)
                
            return True
        except Exception as e:
            logger.error(f"Error revoking tokens: {str(e)}")
            raise
    
    def get_contacts(self, access_token, max_results=1000):
        """Get Google contacts"""
        try:
            credentials = Credentials(token=access_token)
            service = build('people', 'v1', credentials=credentials)
            
            results = service.people().connections().list(
                resourceName='people/me',
                personFields='names,emailAddresses,phoneNumbers,organizations',
                pageSize=max_results
            ).execute()
            
            contacts = results.get('connections', [])
            
            processed_contacts = []
            for contact in contacts:
                names = contact.get('names', [])
                emails = contact.get('emailAddresses', [])
                phones = contact.get('phoneNumbers', [])
                organizations = contact.get('organizations', [])
                
                processed_contact = {
                    'google_id': contact.get('resourceName', '').replace('people/', ''),
                    'name': names[0].get('displayName', '') if names else '',
                    'first_name': names[0].get('givenName', '') if names else '',
                    'last_name': names[0].get('familyName', '') if names else '',
                    'email': emails[0].get('value', '') if emails else '',
                    'phone': phones[0].get('value', '') if phones else '',
                    'company': organizations[0].get('name', '') if organizations else '',
                    'job_title': organizations[0].get('title', '') if organizations else ''
                }
                processed_contacts.append(processed_contact)
            
            return processed_contacts
        except HttpError as e:
            logger.error(f"Error getting contacts: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error getting contacts: {str(e)}")
            raise
    
    def get_calendar_events(self, access_token, max_results=100, time_min=None, time_max=None):
        """Get Google calendar events"""
        try:
            credentials = Credentials(token=access_token)
            service = build('calendar', 'v3', credentials=credentials)
            
            # Get primary calendar
            calendar_list = service.calendarList().list().execute()
            primary_calendar = None
            for calendar in calendar_list.get('items', []):
                if calendar.get('primary'):
                    primary_calendar = calendar['id']
                    break
            
            if not primary_calendar:
                raise ValueError("No primary calendar found")
            
            # Set default time range if not provided
            if not time_min:
                time_min = datetime.utcnow().isoformat() + 'Z'
            if not time_max:
                time_max = (datetime.utcnow() + timedelta(days=30)).isoformat() + 'Z'
            
            events_result = service.events().list(
                calendarId=primary_calendar,
                timeMin=time_min,
                timeMax=time_max,
                maxResults=max_results,
                singleEvents=True,
                orderBy='startTime'
            ).execute()
            
            events = events_result.get('items', [])
            
            processed_events = []
            for event in events:
                start = event.get('start', {})
                end = event.get('end', {})
                attendees = event.get('attendees', [])
                
                processed_event = {
                    'google_id': event.get('id'),
                    'title': event.get('summary', ''),
                    'description': event.get('description', ''),
                    'start_time': start.get('dateTime') or start.get('date'),
                    'end_time': end.get('dateTime') or end.get('date'),
                    'location': event.get('location', ''),
                    'attendees': [att.get('email', '') for att in attendees],
                    'creator': event.get('creator', {}).get('email', ''),
                    'organizer': event.get('organizer', {}).get('email', '')
                }
                processed_events.append(processed_event)
            
            return processed_events
        except HttpError as e:
            logger.error(f"Error getting calendar events: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error getting calendar events: {str(e)}")
            raise
    
    def create_or_update_user(self, user_info, tokens):
        """Create or update user with Google OAuth data"""
        try:
            google_id = user_info['google_id']
            email = user_info['email']
            
            # Check if user exists by Google ID
            user = User.query.filter_by(google_id=google_id).first()
            
            if not user:
                # Check if user exists by email (for account linking)
                user = User.query.filter_by(email=email).first()
                
                if user:
                    # Link Google account to existing user
                    user.google_id = google_id
                    user.provider = 'google'
                else:
                    # Create new user
                    user = User(
                        id=str(uuid.uuid4()),
                        email=email,
                        full_name=user_info.get('name', ''),
                        avatar_url=user_info.get('picture'),
                        provider='google',
                        google_id=google_id,
                        is_approved=True  # Auto-approve Google users
                    )
                    user.approved_at = datetime.utcnow()
                    user.approved_by = user.id
                    db.session.add(user)
            
            # Update tokens
            user.google_access_token = tokens['access_token']
            user.google_refresh_token = tokens['refresh_token']
            if tokens.get('expires_at'):
                user.google_token_expires_at = datetime.fromisoformat(tokens['expires_at'].replace('Z', '+00:00'))
            
            user.updated_at = datetime.utcnow()
            db.session.commit()
            
            return user
        except Exception as e:
            logger.error(f"Error creating/updating user: {str(e)}")
            db.session.rollback()
            raise
    
    def is_token_valid(self, user):
        """Check if user's Google token is still valid"""
        if not user.google_access_token or not user.google_token_expires_at:
            return False
        
        return datetime.utcnow() < user.google_token_expires_at
    
    def ensure_valid_token(self, user):
        """Ensure user has a valid Google access token, refresh if needed"""
        if self.is_token_valid(user):
            return user.google_access_token
        
        if not user.google_refresh_token:
            raise ValueError("No refresh token available")
        
        try:
            refreshed_tokens = self.refresh_access_token(user.google_refresh_token)
            
            user.google_access_token = refreshed_tokens['access_token']
            if refreshed_tokens.get('expires_at'):
                user.google_token_expires_at = datetime.fromisoformat(
                    refreshed_tokens['expires_at'].replace('Z', '+00:00')
                )
            user.updated_at = datetime.utcnow()
            db.session.commit()
            
            return user.google_access_token
        except Exception as e:
            logger.error(f"Error refreshing token for user {user.id}: {str(e)}")
            raise
    
    def sync_contacts(self, user):
        """Sync Google contacts to the database"""
        if not self.enabled:
            raise ValueError("Google OAuth is not configured")
        
        try:
            # Get contacts from Google
            contacts = self.get_contacts(user)
            
            # Import here to avoid circular imports
            from dal.models import Person
            from dal.database import db
            
            synced_count = 0
            for contact in contacts:
                # Check if contact already exists (by email)
                existing_person = None
                if contact.get('email'):
                    existing_person = Person.query.filter_by(
                        user_id=user.id,
                        email=contact['email']
                    ).first()
                
                if not existing_person:
                    # Create new person
                    person = Person(
                        id=str(uuid.uuid4()),
                        full_name=contact.get('name', 'Unknown'),
                        email=contact.get('email'),
                        company=contact.get('company'),
                        phone=contact.get('phone'),
                        owner_id=user.id,
                        created_by=user.id,
                        source='google_contacts'
                    )
                    db.session.add(person)
                    synced_count += 1
                else:
                    logger.info(f"Skipping duplicate contact: {contact.get('name', 'Unknown')} ({contact.get('email', 'No email')})")
            
            db.session.commit()
            logger.info(f"Synced {synced_count} Google contacts for user {user.id}")
            return synced_count
            
        except Exception as e:
            logger.error(f"Error syncing contacts: {str(e)}")
            raise
    
    def sync_calendar_events(self, user):
        """Sync Google calendar events to the database"""
        if not self.enabled:
            raise ValueError("Google OAuth is not configured")
        
        try:
            # Get calendar events from Google
            events = self.get_calendar_events(user)
            
            # Import here to avoid circular imports
            from dal.models import Event
            from dal.database import db
            
            synced_count = 0
            for event_data in events:
                # Check if event already exists (by Google event ID or title + start time)
                existing_event = None
                
                # First check by Google event ID
                if event_data.get('id'):
                    existing_event = Event.query.filter_by(
                        user_id=user.id,
                        google_event_id=event_data['id']
                    ).first()
                
                # If not found by Google ID, check by title + start time
                if not existing_event:
                    event_title = event_data.get('summary', 'Untitled Event')
                    event_start = datetime.fromisoformat(event_data['start']['dateTime'].replace('Z', '+00:00'))
                    
                    existing_event = Event.query.filter_by(
                        user_id=user.id,
                        title=event_title,
                        start_datetime=event_start
                    ).first()
                
                if not existing_event:
                    # Create new event
                    event = Event(
                        id=str(uuid.uuid4()),
                        title=event_title,
                        description=event_data.get('description'),
                        start_datetime=event_start,
                        end_datetime=datetime.fromisoformat(event_data['end']['dateTime'].replace('Z', '+00:00')),
                        location=event_data.get('location'),
                        google_event_id=event_data.get('id'),
                        user_id=user.id,
                        created_by=user.id,
                        is_active=True
                    )
                    db.session.add(event)
                    synced_count += 1
                else:
                    logger.info(f"Skipping duplicate event: {event_title} at {event_start}")
            
            db.session.commit()
            logger.info(f"Synced {synced_count} Google calendar events for user {user.id}")
            return synced_count
            
        except Exception as e:
            logger.error(f"Error syncing calendar events: {str(e)}")
            raise
