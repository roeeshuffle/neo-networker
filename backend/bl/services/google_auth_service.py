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
    
    def get_contacts(self, access_token, max_results=2000):
        """Get Google contacts with pagination support"""
        try:
            credentials = Credentials(token=access_token)
            service = build('people', 'v1', credentials=credentials)
            
            all_contacts = []
            page_token = None
            page_size = min(1000, max_results)  # Google API max page size is 1000
            
            while len(all_contacts) < max_results:
                # Calculate how many contacts to fetch in this request
                remaining = max_results - len(all_contacts)
                current_page_size = min(page_size, remaining)
                
                request_params = {
                    'resourceName': 'people/me',
                    'personFields': 'names,emailAddresses,phoneNumbers,organizations',
                    'pageSize': current_page_size
                }
                
                if page_token:
                    request_params['pageToken'] = page_token
                
                results = service.people().connections().list(**request_params).execute()
                
                contacts = results.get('connections', [])
                all_contacts.extend(contacts)
                
                # Check if there are more pages
                page_token = results.get('nextPageToken')
                if not page_token:
                    break
                
                logger.info(f"Fetched {len(contacts)} contacts, total so far: {len(all_contacts)}")
            
            processed_contacts = []
            for contact in all_contacts:
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
                    'job_title': organizations[0].get('title', '') if organizations else '',
                    'is_duplicate': False  # Will be set later in get_contacts_preview
                }
                processed_contacts.append(processed_contact)
            
            logger.info(f"Successfully fetched {len(processed_contacts)} contacts from Google")
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
                time_min = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0).isoformat() + 'Z'
            if not time_max:
                # Default to next year if not specified
                today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
                next_year = datetime(today.year + 1, 12, 31, 23, 59, 59)
                time_max = next_year.isoformat() + 'Z'
            
            events_result = service.events().list(
                calendarId=primary_calendar,
                timeMin=time_min,
                timeMax=time_max,
                maxResults=max_results,
                singleEvents=True,
                orderBy='startTime'
            ).execute()
            
            events = events_result.get('items', [])
            
            logger.info(f"📅 DEBUG: Retrieved {len(events)} events from Google Calendar")
            
            processed_events = []
            for i, event in enumerate(events):
                # Debug logging for each event
                logger.info(f"📅 DEBUG Event {i+1}:")
                logger.info(f"  - Raw event keys: {list(event.keys())}")
                logger.info(f"  - Event ID: {event.get('id', 'NO_ID')}")
                logger.info(f"  - Summary: '{event.get('summary', 'NO_SUMMARY')}'")
                logger.info(f"  - Description: '{event.get('description', 'NO_DESCRIPTION')[:100]}...'")
                logger.info(f"  - Location: '{event.get('location', 'NO_LOCATION')}'")
                logger.info(f"  - Creator: {event.get('creator', {})}")
                logger.info(f"  - Organizer: {event.get('organizer', {})}")
                logger.info(f"  - Start: {event.get('start', {})}")
                logger.info(f"  - End: {event.get('end', {})}")
                
                start = event.get('start', {})
                end = event.get('end', {})
                attendees = event.get('attendees', [])
                
                # Try multiple fields for title
                title = event.get('summary') or event.get('title') or event.get('subject') or 'Untitled Event'
                
                processed_event = {
                    'google_id': event.get('id'),
                    'title': title,
                    'description': event.get('description', ''),
                    'start_time': start.get('dateTime') or start.get('date'),
                    'end_time': end.get('dateTime') or end.get('date'),
                    'location': event.get('location', ''),
                    'attendees': [att.get('email', '') for att in attendees],
                    'creator': event.get('creator', {}).get('email', ''),
                    'organizer': event.get('organizer', {}).get('email', '')
                }
                
                logger.info(f"  - Processed title: '{processed_event['title']}'")
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
            raise ValueError("No refresh token available. Please re-authenticate with Google.")
        
        logger.info(f"Refreshing expired Google token for user {user.id}")
        
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
            # If refresh fails, the user needs to re-authenticate
            raise ValueError(f"Failed to refresh Google token. Please re-authenticate with Google. Error: {str(e)}")
    
    def get_contacts_preview(self, user):
        """Get Google contacts preview (without inserting to database)"""
        if not self.enabled:
            raise ValueError("Google OAuth is not configured")
        
        try:
            # Get valid access token (refresh if needed)
            access_token = self.ensure_valid_token(user)
            
            # Get ALL contacts from Google (with pagination support, up to 5000 contacts)
            contacts = self.get_contacts(access_token, max_results=5000)
            
            # Import here to avoid circular imports
            from dal.models import Person
            from dal.database import db
            
            preview_data = []
            for contact in contacts:
                # Check if contact already exists (by email)
                existing_person = None
                if contact.get('email'):
                    existing_person = Person.query.filter_by(
                        owner_id=user.id,
                        email=contact['email']
                    ).first()
                
                preview_data.append({
                    'name': contact.get('name', 'Unknown'),
                    'email': contact.get('email'),
                    'company': contact.get('company'),
                    'phone': contact.get('phone'),
                    'is_duplicate': existing_person is not None,
                    'existing_id': existing_person.id if existing_person else None
                })
            
            logger.info(f"Generated preview for {len(preview_data)} Google contacts for user {user.id}")
            return preview_data
            
        except Exception as e:
            logger.error(f"Error getting contacts preview: {str(e)}")
            raise

    def get_calendar_events_preview(self, user):
        """Get Google calendar events preview (without inserting to database)"""
        if not self.enabled:
            raise ValueError("Google OAuth is not configured")
        
        try:
            # Get valid access token (refresh if needed)
            access_token = self.ensure_valid_token(user)
            
            # Set date range: today to next year
            today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            next_year = datetime(today.year + 1, 12, 31, 23, 59, 59)
            
            # Get calendar events from Google with date range
            events = self.get_calendar_events(
                access_token, 
                max_results=1000,
                time_min=today.isoformat() + 'Z',
                time_max=next_year.isoformat() + 'Z'
            )
            
            # Import here to avoid circular imports
            from dal.models import Event
            from dal.database import db
            
            preview_data = []
            logger.info(f"📅 CALENDAR PREVIEW DEBUG: Processing {len(events)} events for preview")
            
            for i, event_data in enumerate(events):
                logger.info(f"📅 PREVIEW Event {i+1}:")
                logger.info(f"  - Event data keys: {list(event_data.keys())}")
                logger.info(f"  - Summary field: '{event_data.get('summary', 'NO_SUMMARY')}'")
                logger.info(f"  - Title field: '{event_data.get('title', 'NO_TITLE')}'")
                logger.info(f"  - Subject field: '{event_data.get('subject', 'NO_SUBJECT')}'")
                
                # Check if event already exists (by Google event ID or title + start time)
                existing_event = None
                
                # First check by Google event ID
                if event_data.get('id'):
                    existing_event = Event.query.filter_by(
                        user_id=user.id,
                        google_event_id=event_data['id']
                    ).first()
                
                # Parse event dates safely - try multiple fields for title
                event_title = event_data.get('summary') or event_data.get('title') or event_data.get('subject') or 'Untitled Event'
                logger.info(f"  - Final event title: '{event_title}'")
                event_start = None
                event_end = None
                
                # Debug logging to see what we're getting
                logger.info(f"Processing event: {event_title}")
                logger.info(f"Event data keys: {list(event_data.keys())}")
                
                # Handle different date formats - events come with start_time and end_time already processed
                if 'start_time' in event_data and event_data['start_time']:
                    try:
                        # Parse the start time (could be dateTime or date format)
                        start_time_str = event_data['start_time']
                        if 'T' in start_time_str:
                            # DateTime format: 2025-10-25T00:00:00+03:00
                            event_start = datetime.fromisoformat(start_time_str.replace('Z', '+00:00'))
                        else:
                            # Date format: 2025-10-25
                            event_start = datetime.fromisoformat(start_time_str + 'T00:00:00+00:00')
                    except Exception as e:
                        logger.warning(f"Error parsing start_time '{event_data['start_time']}': {e}")
                        event_start = None
                
                if 'end_time' in event_data and event_data['end_time']:
                    try:
                        # Parse the end time (could be dateTime or date format)
                        end_time_str = event_data['end_time']
                        if 'T' in end_time_str:
                            # DateTime format: 2025-10-25T01:00:00+03:00
                            event_end = datetime.fromisoformat(end_time_str.replace('Z', '+00:00'))
                        else:
                            # Date format: 2025-10-25
                            event_end = datetime.fromisoformat(end_time_str + 'T23:59:59+00:00')
                    except Exception as e:
                        logger.warning(f"Error parsing end_time '{event_data['end_time']}': {e}")
                        event_end = None
                
                # Skip events without valid start time
                if not event_start:
                    logger.warning(f"Skipping event '{event_title}' - no valid start time. Event data: {event_data}")
                    continue
                
                # If no end time, set it to 1 hour after start
                if not event_end:
                    event_end = event_start + timedelta(hours=1)
                
                # If not found by Google ID, check by title + start time
                if not existing_event:
                    existing_event = Event.query.filter_by(
                        user_id=user.id,
                        title=event_title,
                        start_datetime=event_start
                    ).first()
                
                preview_data.append({
                    'title': event_title,
                    'description': event_data.get('description'),
                    'start_datetime': event_start.isoformat(),
                    'end_datetime': event_end.isoformat(),
                    'location': event_data.get('location'),
                    'google_event_id': event_data.get('id'),
                    'is_duplicate': existing_event is not None,
                    'existing_id': existing_event.id if existing_event else None
                })
            
            logger.info(f"Generated preview for {len(preview_data)} Google calendar events for user {user.id}")
            return preview_data
            
        except Exception as e:
            logger.error(f"Error getting calendar events preview: {str(e)}")
            raise
    
    def sync_contacts(self, user):
        """Sync Google contacts to the database"""
        if not self.enabled:
            raise ValueError("Google OAuth is not configured")
        
        try:
            # Get valid access token (refresh if needed)
            access_token = self.ensure_valid_token(user)
            
            # Get contacts from Google (with pagination support, up to 5000 contacts)
            contacts = self.get_contacts(access_token, max_results=5000)
            
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
                        first_name=contact.get('first_name', ''),
                        last_name=contact.get('last_name', ''),
                        email=contact.get('email'),
                        organization=contact.get('company', ''),  # Google returns 'company', we store as 'organization'
                        phone=contact.get('phone'),
                        job_title=contact.get('job_title', ''),
                        owner_id=user.id,
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
            # Get valid access token (refresh if needed)
            access_token = self.ensure_valid_token(user)
            
            # Get calendar events from Google
            events = self.get_calendar_events(access_token, max_results=1000)
            
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
