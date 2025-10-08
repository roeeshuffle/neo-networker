from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from dal.database import db
from dal.models import Event, User
from datetime import datetime, timedelta
from sqlalchemy import and_, or_
from bl.services.notification_service import notify_event_participant, notify_event_updated
from bl.services.google_calendar_sync_service import google_calendar_sync_service
import json

events_bp = Blueprint('events', __name__)

@events_bp.route('/events', methods=['GET'])
@jwt_required()
def get_events():
    """Get all events for the authenticated user"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user or not current_user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Get query parameters
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        project = request.args.get('project')
        
        # Build query - show events where user is owner OR participant
        from sqlalchemy import text
        query = Event.query.filter(
            or_(
                Event.owner_id == current_user_id,
                text("participants @> :email").params(email=f'[{{"email": "{current_user.email}"}}]')
            ),
            Event.is_active == True
        )
        
        if start_date:
            start_datetime = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            query = query.filter(Event.start_datetime >= start_datetime)
        
        if end_date:
            end_datetime = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            query = query.filter(Event.end_datetime <= end_datetime)
        
        events = query.order_by(Event.start_datetime.asc()).all()
        
        return jsonify({
            'events': [event.to_dict() for event in events],
            'count': len(events)
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@events_bp.route('/events', methods=['POST'])
@jwt_required()
def create_event():
    """Create a new event"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user or not current_user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'start_datetime', 'end_datetime']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Parse datetime fields
        start_datetime = datetime.fromisoformat(data['start_datetime'].replace('Z', '+00:00'))
        end_datetime = datetime.fromisoformat(data['end_datetime'].replace('Z', '+00:00'))
        
        # Create event
        event = Event(
            title=data['title'],
            description=data.get('description', ''),
            start_datetime=start_datetime,
            end_datetime=end_datetime,
            location=data.get('location', ''),
            event_type=data.get('event_type', 'event'),
            project=data.get('project', ''),
            participants=data.get('participants', []),
            alert_minutes=data.get('alert_minutes', 15),
            repeat_pattern=data.get('repeat_pattern', 'none'),
            repeat_interval=data.get('repeat_interval', 1),
            repeat_days=data.get('repeat_days', []),
            repeat_end_date=datetime.fromisoformat(data['repeat_end_date'].replace('Z', '+00:00')) if data.get('repeat_end_date') else None,
            notes=data.get('notes', ''),
            # google_sync=data.get('google_sync', True),  # TEMPORARILY DISABLED - will be added after migration
            user_id=current_user_id,
            owner_id=current_user_id
        )
        
        db.session.add(event)
        db.session.commit()
        
        # Sync to Google Calendar if enabled and user has Google account - TEMPORARILY DISABLED
        # if event.google_sync and current_user.google_id:
        #     try:
        #         google_calendar_sync_service.sync_event_to_google_calendar(event, current_user, 'create')
        #     except Exception as sync_error:
        #         # Log the error but don't fail the event creation
        #         print(f"Warning: Failed to sync event to Google Calendar: {str(sync_error)}")
        
        # Sync to Google Calendar if enabled and user has Google account
        if current_user.google_id:
            try:
                google_calendar_sync_service.sync_event_to_google_calendar(event, current_user, 'create')
            except Exception as sync_error:
                # Log the error but don't fail the event creation
                print(f"Warning: Failed to sync event to Google Calendar: {str(sync_error)}")
        
        # Notify participants about the new event
        if data.get('participants'):
            for participant in data['participants']:
                if participant.get('email') and participant['email'] != current_user.email:
                    notify_event_participant(current_user.email, event.title, participant['email'])
        
        return jsonify({
            'message': 'Event created successfully',
            'event': event.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@events_bp.route('/events/<int:event_id>', methods=['GET'])
@jwt_required()
def get_event(event_id):
    """Get a specific event"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user or not current_user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        event = Event.query.filter(
            Event.id == event_id,
            Event.owner_id == current_user_id
        ).first()
        
        if not event:
            return jsonify({'error': 'Event not found'}), 404
        
        return jsonify({'event': event.to_dict()})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@events_bp.route('/events/<int:event_id>', methods=['PUT'])
@jwt_required()
def update_event(event_id):
    """Update an event"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user or not current_user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        event = Event.query.filter(
            Event.id == event_id,
            Event.owner_id == current_user_id
        ).first()
        
        if not event:
            return jsonify({'error': 'Event not found'}), 404
        
        data = request.get_json()
        
        # Update fields
        if 'title' in data:
            event.title = data['title']
        if 'description' in data:
            event.description = data['description']
        if 'start_datetime' in data:
            event.start_datetime = datetime.fromisoformat(data['start_datetime'].replace('Z', '+00:00'))
        if 'end_datetime' in data:
            event.end_datetime = datetime.fromisoformat(data['end_datetime'].replace('Z', '+00:00'))
        if 'location' in data:
            event.location = data['location']
        if 'event_type' in data:
            event.event_type = data['event_type']
        if 'project' in data:
            event.project = data['project']
        if 'participants' in data:
            event.participants = data['participants']
        if 'alert_minutes' in data:
            event.alert_minutes = data['alert_minutes']
        if 'repeat_pattern' in data:
            event.repeat_pattern = data['repeat_pattern']
        if 'repeat_interval' in data:
            event.repeat_interval = data['repeat_interval']
        if 'repeat_days' in data:
            event.repeat_days = data['repeat_days']
        if 'repeat_end_date' in data:
            event.repeat_end_date = datetime.fromisoformat(data['repeat_end_date'].replace('Z', '+00:00')) if data['repeat_end_date'] else None
        if 'notes' in data:
            event.notes = data['notes']
        # if 'google_sync' in data:  # TEMPORARILY DISABLED
        #     event.google_sync = data['google_sync']
        
        event.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        # Sync to Google Calendar if enabled and user has Google account - TEMPORARILY DISABLED
        # if event.google_sync and current_user.google_id:
        #     try:
        #         google_calendar_sync_service.sync_event_to_google_calendar(event, current_user, 'update')
        #     except Exception as sync_error:
        #         # Log the error but don't fail the event update
        #         print(f"Warning: Failed to sync event update to Google Calendar: {str(sync_error)}")
        
        # Sync to Google Calendar if enabled and user has Google account
        if current_user.google_id:
            try:
                google_calendar_sync_service.sync_event_to_google_calendar(event, current_user, 'update')
            except Exception as sync_error:
                # Log the error but don't fail the event update
                print(f"Warning: Failed to sync event update to Google Calendar: {str(sync_error)}")
        
        # Notify participants about the event update
        if event.participants:
            for participant in event.participants:
                if participant.get('email') and participant['email'] != current_user.email:
                    notify_event_updated(current_user.email, event.title, participant['email'])
        
        return jsonify({
            'message': 'Event updated successfully',
            'event': event.to_dict()
        })
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@events_bp.route('/events/<int:event_id>', methods=['DELETE'])
@jwt_required()
def delete_event(event_id):
    """Delete an event"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user or not current_user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        event = Event.query.filter(
            Event.id == event_id,
            Event.owner_id == current_user_id
        ).first()
        
        if not event:
            return jsonify({'error': 'Event not found'}), 404
        
        # Sync deletion to Google Calendar if enabled and user has Google account - TEMPORARILY DISABLED
        # if event.google_sync and current_user.google_id:
        #     try:
        #         google_calendar_sync_service.sync_event_to_google_calendar(event, current_user, 'delete')
        #     except Exception as sync_error:
        #         # Log the error but don't fail the event deletion
        #         print(f"Warning: Failed to sync event deletion to Google Calendar: {str(sync_error)}")
        
        # Sync deletion to Google Calendar if enabled and user has Google account
        if current_user.google_id:
            try:
                google_calendar_sync_service.sync_event_to_google_calendar(event, current_user, 'delete')
            except Exception as sync_error:
                # Log the error but don't fail the event deletion
                print(f"Warning: Failed to sync event deletion to Google Calendar: {str(sync_error)}")
        
        # Soft delete by setting is_active to False
        event.is_active = False
        event.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({'message': 'Event deleted successfully'})
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@events_bp.route('/events/upcoming', methods=['GET'])
@jwt_required()
def get_upcoming_events():
    """Get upcoming events for the next 7 days"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user or not current_user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        now = datetime.utcnow()
        next_week = now + timedelta(days=7)
        
        events = Event.query.filter(
            Event.owner_id == current_user_id,
            Event.is_active == True,
            Event.start_datetime >= now,
            Event.start_datetime <= next_week
        ).order_by(Event.start_datetime.asc()).all()
        
        return jsonify({
            'events': [event.to_dict() for event in events],
            'count': len(events)
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
