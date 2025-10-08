import os
import logging
from datetime import datetime, timedelta
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from dal.models import User, Event
from dal.database import db

logger = logging.getLogger(__name__)

class GoogleCalendarSyncService:
    """Service for syncing events with Google Calendar"""
    
    def __init__(self):
        self.enabled = True  # Always enabled if Google OAuth is configured
    
    def ensure_valid_token(self, user: User) -> str:
        """Ensure user has a valid Google access token"""
        if not user.google_access_token:
            raise ValueError("No Google access token found. Please reconnect your Google account.")
        
        # Check if token is expired
        if user.google_token_expires_at and user.google_token_expires_at <= datetime.utcnow():
            if not user.google_refresh_token:
                raise ValueError("Google token expired and no refresh token available. Please reconnect your Google account.")
            
            # Refresh the token
            credentials = Credentials(
                token=user.google_access_token,
                refresh_token=user.google_refresh_token,
                token_uri="https://oauth2.googleapis.com/token",
                client_id=os.getenv('GOOGLE_CLIENT_ID'),
                client_secret=os.getenv('GOOGLE_CLIENT_SECRET')
            )
            
            credentials.refresh(Request())
            
            # Update user with new tokens
            user.google_access_token = credentials.token
            if credentials.refresh_token:
                user.google_refresh_token = credentials.refresh_token
            if credentials.expiry:
                user.google_token_expires_at = credentials.expiry
            
            db.session.commit()
            logger.info(f"Refreshed Google token for user {user.id}")
        
        return user.google_access_token
    
    def create_event_in_google_calendar(self, event: Event, user: User) -> str:
        """Create an event in Google Calendar and return the Google event ID"""
        try:
            access_token = self.ensure_valid_token(user)
            credentials = Credentials(token=access_token)
            service = build('calendar', 'v3', credentials=credentials)
            
            # Convert our event to Google Calendar format
            google_event = {
                'summary': event.title,
                'description': event.description or '',
                'location': event.location or '',
                'start': {
                    'dateTime': event.start_datetime.isoformat(),
                    'timeZone': 'UTC'
                },
                'end': {
                    'dateTime': event.end_datetime.isoformat(),
                    'timeZone': 'UTC'
                },
                'reminders': {
                    'useDefault': False,
                    'overrides': [
                        {'method': 'popup', 'minutes': event.alert_minutes or 15}
                    ]
                }
            }
            
            # Add participants if any
            if event.participants:
                attendees = []
                for participant in event.participants:
                    if participant.get('email'):
                        attendees.append({
                            'email': participant['email'],
                            'displayName': participant.get('name', participant['email'])
                        })
                if attendees:
                    google_event['attendees'] = attendees
            
            # Create the event
            created_event = service.events().insert(
                calendarId='primary',
                body=google_event
            ).execute()
            
            google_event_id = created_event['id']
            logger.info(f"Created Google Calendar event {google_event_id} for event {event.id}")
            
            return google_event_id
            
        except HttpError as e:
            logger.error(f"Error creating Google Calendar event: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error creating Google Calendar event: {str(e)}")
            raise
    
    def update_event_in_google_calendar(self, event: Event, user: User) -> bool:
        """Update an event in Google Calendar"""
        try:
            if not event.google_event_id:
                logger.warning(f"Event {event.id} has no Google event ID, creating new event")
                google_event_id = self.create_event_in_google_calendar(event, user)
                event.google_event_id = google_event_id
                db.session.commit()
                return True
            
            access_token = self.ensure_valid_token(user)
            credentials = Credentials(token=access_token)
            service = build('calendar', 'v3', credentials=credentials)
            
            # Convert our event to Google Calendar format
            google_event = {
                'summary': event.title,
                'description': event.description or '',
                'location': event.location or '',
                'start': {
                    'dateTime': event.start_datetime.isoformat(),
                    'timeZone': 'UTC'
                },
                'end': {
                    'dateTime': event.end_datetime.isoformat(),
                    'timeZone': 'UTC'
                },
                'reminders': {
                    'useDefault': False,
                    'overrides': [
                        {'method': 'popup', 'minutes': event.alert_minutes or 15}
                    ]
                }
            }
            
            # Add participants if any
            if event.participants:
                attendees = []
                for participant in event.participants:
                    if participant.get('email'):
                        attendees.append({
                            'email': participant['email'],
                            'displayName': participant.get('name', participant['email'])
                        })
                if attendees:
                    google_event['attendees'] = attendees
            
            # Update the event
            service.events().update(
                calendarId='primary',
                eventId=event.google_event_id,
                body=google_event
            ).execute()
            
            logger.info(f"Updated Google Calendar event {event.google_event_id} for event {event.id}")
            return True
            
        except HttpError as e:
            if e.resp.status == 404:
                logger.warning(f"Google Calendar event {event.google_event_id} not found, creating new event")
                google_event_id = self.create_event_in_google_calendar(event, user)
                event.google_event_id = google_event_id
                db.session.commit()
                return True
            else:
                logger.error(f"Error updating Google Calendar event: {str(e)}")
                raise
        except Exception as e:
            logger.error(f"Unexpected error updating Google Calendar event: {str(e)}")
            raise
    
    def delete_event_from_google_calendar(self, event: Event, user: User) -> bool:
        """Delete an event from Google Calendar"""
        try:
            if not event.google_event_id:
                logger.warning(f"Event {event.id} has no Google event ID, nothing to delete")
                return True
            
            access_token = self.ensure_valid_token(user)
            credentials = Credentials(token=access_token)
            service = build('calendar', 'v3', credentials=credentials)
            
            # Delete the event
            service.events().delete(
                calendarId='primary',
                eventId=event.google_event_id
            ).execute()
            
            logger.info(f"Deleted Google Calendar event {event.google_event_id} for event {event.id}")
            return True
            
        except HttpError as e:
            if e.resp.status == 404:
                logger.warning(f"Google Calendar event {event.google_event_id} not found, already deleted")
                return True
            else:
                logger.error(f"Error deleting Google Calendar event: {str(e)}")
                raise
        except Exception as e:
            logger.error(f"Unexpected error deleting Google Calendar event: {str(e)}")
            raise
    
    def sync_event_to_google_calendar(self, event: Event, user: User, operation: str = 'create') -> bool:
        """Sync an event to Google Calendar based on operation"""
        try:
            # Check if Google sync is enabled for this event
            if not event.google_sync:
                logger.info(f"Google sync disabled for event {event.id}, skipping")
                return True
            
            # Check if user has Google account connected
            if not user.google_id:
                logger.warning(f"User {user.id} has no Google account connected, skipping sync")
                return True
            
            if operation == 'create':
                google_event_id = self.create_event_in_google_calendar(event, user)
                event.google_event_id = google_event_id
                db.session.commit()
                return True
            elif operation == 'update':
                return self.update_event_in_google_calendar(event, user)
            elif operation == 'delete':
                return self.delete_event_from_google_calendar(event, user)
            else:
                logger.error(f"Unknown operation: {operation}")
                return False
                
        except Exception as e:
            logger.error(f"Error syncing event {event.id} to Google Calendar: {str(e)}")
            # Don't raise the exception to avoid breaking the main operation
            return False

# Create a global instance
google_calendar_sync_service = GoogleCalendarSyncService()
