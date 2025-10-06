from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from dal.models import Person, User
from dal.database import db
from datetime import datetime
import uuid
import logging

people_bp = Blueprint('people', __name__)
people_logger = logging.getLogger('people')

@people_bp.route('/people', methods=['GET'])
@jwt_required()
def get_people():
    """Get all people for the current user"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user or not current_user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Get people owned by user
        people = Person.query.filter(
            Person.owner_id == current_user_id
        ).order_by(Person.created_at.desc()).all()
        
        return jsonify([person.to_dict() for person in people])
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@people_bp.route('/people', methods=['POST'])
@jwt_required()
def create_person():
    """Create a new person"""
    try:
        current_user_id = get_jwt_identity()
        print(f"🔍 PEOPLE CREATE - JWT Identity: {current_user_id}")
        current_user = User.query.get(current_user_id)
        print(f"🔍 PEOPLE CREATE - User found: {current_user is not None}")
        if current_user:
            print(f"🔍 PEOPLE CREATE - User email: {current_user.email}")
            print(f"🔍 PEOPLE CREATE - User approved: {current_user.is_approved}")
            print(f"🔍 PEOPLE CREATE - User telegram_id: {current_user.telegram_id}")
        
        if not current_user or not current_user.is_approved:
            print(f"❌ PEOPLE CREATE - Unauthorized: user={current_user is not None}, approved={current_user.is_approved if current_user else 'N/A'}")
            return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        print(f"🔍 PEOPLE CREATE - Request data: {data}")
        
        # Validate required fields
        if not data.get('first_name') and not data.get('last_name'):
            print("❌ PEOPLE CREATE - Missing required name fields")
            return jsonify({'error': 'At least first_name or last_name is required'}), 400
        
        # Helper function to clean empty strings to None for constrained fields
        def clean_constrained_field(value, allowed_values=None, default_value=None):
            if not value or value.strip() == '':
                return None  # Always return None for empty values
            if allowed_values and value.lower() not in allowed_values:
                return None  # Return None for invalid values
            return value.lower() if allowed_values else value

        # Clean gender field - must be valid or None
        gender = clean_constrained_field(data.get('gender'), ['male', 'female', 'other'])
        
        # Add logging for debugging
        print(f"📝 Creating person: {data.get('first_name', 'Unknown')} {data.get('last_name', '')}")
        print(f"🔍 Gender field: '{data.get('gender')}' -> '{gender}'")
        
        person = Person(
                first_name=data.get('first_name'),
                last_name=data.get('last_name'),
                gender=gender,
                birthday=datetime.strptime(data['birthday'], '%Y-%m-%d').date() if data.get('birthday') else None,
                organization=data.get('organization'),
                job_title=data.get('job_title'),
                job_status=clean_constrained_field(data.get('job_status'), ['employed', 'unemployed', 'student', 'retired', 'other']),
                email=data.get('email'),
                phone=data.get('phone'),
                mobile=data.get('mobile'),
                address=data.get('address'),
                linkedin_url=data.get('linkedin_url'),
                github_url=data.get('github_url'),
                facebook_url=data.get('facebook_url'),
                twitter_url=data.get('twitter_url'),
                website_url=data.get('website_url'),
                notes=data.get('notes'),
                source=data.get('source', 'manual'),
                tags=data.get('tags'),
                last_contact_date=datetime.fromisoformat(data['last_contact_date'].replace('Z', '+00:00')) if data.get('last_contact_date') else None,
                next_follow_up_date=datetime.fromisoformat(data['next_follow_up_date'].replace('Z', '+00:00')) if data.get('next_follow_up_date') else None,
                status=clean_constrained_field(data.get('status'), ['active', 'inactive', 'prospect', 'client', 'partner']),
                priority=clean_constrained_field(data.get('priority'), ['low', 'medium', 'high']),
                group=data.get('group'),
                custom_fields=data.get('custom_fields', {}),
                owner_id=current_user_id
            )
        
        db.session.add(person)
        db.session.commit()
        
        return jsonify(person.to_dict()), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@people_bp.route('/people/<person_id>', methods=['PUT'])
@jwt_required()
def update_person(person_id):
    """Update a person"""
    try:
        current_user_id = get_jwt_identity()
        print(f"🔍 Debug - JWT Identity: {current_user_id}")
        current_user = User.query.get(current_user_id)
        print(f"🔍 Debug - User found: {current_user is not None}")
        print(f"🔍 Debug - User approved: {current_user.is_approved if current_user else 'N/A'}")
        
        if not current_user or not current_user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        person = Person.query.get(person_id)
        if not person:
            return jsonify({'error': 'Person not found'}), 404
        
        # Check if user owns this person
        if person.owner_id != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        
        # Helper function to clean empty strings to None for constrained fields
        def clean_constrained_field(value, allowed_values=None):
            if not value or value.strip() == '':
                return None
            if allowed_values and value.lower() not in allowed_values:
                return None
            return value.lower() if allowed_values else value

        # Clean constrained fields
        if 'gender' in data:
            data['gender'] = clean_constrained_field(data.get('gender'), ['male', 'female', 'other'])
        if 'job_status' in data:
            data['job_status'] = clean_constrained_field(data.get('job_status'), ['employed', 'unemployed', 'student', 'retired', 'other'])
        if 'status' in data:
            data['status'] = clean_constrained_field(data.get('status'), ['active', 'inactive', 'prospect', 'client', 'partner']) or 'active'
        if 'priority' in data:
            data['priority'] = clean_constrained_field(data.get('priority'), ['low', 'medium', 'high']) or 'medium'

        # Update fields dynamically
        person.first_name = data.get('first_name', person.first_name)
        person.last_name = data.get('last_name', person.last_name)
        person.gender = data.get('gender', person.gender)
        person.birthday = datetime.strptime(data['birthday'], '%Y-%m-%d').date() if data.get('birthday') else person.birthday
        person.organization = data.get('organization', person.organization)
        person.job_title = data.get('job_title', person.job_title)
        person.job_status = data.get('job_status', person.job_status)
        person.email = data.get('email', person.email)
        person.phone = data.get('phone', person.phone)
        person.mobile = data.get('mobile', person.mobile)
        person.address = data.get('address', person.address)
        person.linkedin_url = data.get('linkedin_url', person.linkedin_url)
        person.github_url = data.get('github_url', person.github_url)
        person.facebook_url = data.get('facebook_url', person.facebook_url)
        person.twitter_url = data.get('twitter_url', person.twitter_url)
        person.website_url = data.get('website_url', person.website_url)
        person.notes = data.get('notes', person.notes)
        person.source = data.get('source', person.source)
        person.tags = data.get('tags', person.tags)
        person.last_contact_date = datetime.fromisoformat(data['last_contact_date'].replace('Z', '+00:00')) if data.get('last_contact_date') else person.last_contact_date
        person.next_follow_up_date = datetime.fromisoformat(data['next_follow_up_date'].replace('Z', '+00:00')) if data.get('next_follow_up_date') else person.next_follow_up_date
        person.status = data.get('status', person.status)
        person.priority = data.get('priority', person.priority)
        person.group = data.get('group', person.group)
        person.custom_fields = data.get('custom_fields', person.custom_fields)
        person.updated_at = datetime.utcnow()
        
        print(f"🔍 PEOPLE UPDATE: Person {person.id} custom_fields updated")
        print(f"🔍 PEOPLE UPDATE: New custom_fields: {person.custom_fields}")
        print(f"🔍 PEOPLE UPDATE: Data custom_fields: {data.get('custom_fields')}")
        
        db.session.commit()
        
        return jsonify(person.to_dict())
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@people_bp.route('/people/<person_id>', methods=['DELETE'])
@jwt_required()
def delete_person(person_id):
    """Delete a person"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user or not current_user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        person = Person.query.get(person_id)
        if not person:
            return jsonify({'error': 'Person not found'}), 404
        
        # Check if user owns this person
        if person.owner_id != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        db.session.delete(person)
        db.session.commit()
        
        return jsonify({'message': 'Person deleted successfully'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@people_bp.route('/people/delete-all', methods=['DELETE'])
@jwt_required()
def delete_all_people():
    """Delete all people for the current user"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user or not current_user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Delete all people owned by this user
        deleted_count = Person.query.filter_by(owner_id=current_user_id).delete()
        db.session.commit()
        
        return jsonify({'message': f'Successfully deleted {deleted_count} people'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Share functionality removed - SharedData model deleted

# User Preferences endpoints (temporary location)
@people_bp.route('/user-preferences', methods=['GET'])
@jwt_required()
def get_user_preferences():
    """Get user preferences"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        preferences = user.user_preferences or {}
        
        people_logger.info(f"🔍 USER PREFS GET: User {user.email}")
        people_logger.info(f"🔍 USER PREFS GET: Preferences: {preferences}")
        
        return jsonify({
            'success': True,
            'preferences': preferences
        })
        
    except Exception as e:
        people_logger.error(f"Error getting user preferences: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@people_bp.route('/user-preferences', methods=['POST'])
@jwt_required()
def save_user_preferences():
    """Save user preferences"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        people_logger.info(f"🔍 USER PREFS SAVE: User {user.email}")
        people_logger.info(f"🔍 USER PREFS SAVE: Data: {data}")
        
        # Initialize user preferences if not exists
        if not user.user_preferences:
            user.user_preferences = {}
        
        # Update specific preference fields
        for key, value in data.items():
            people_logger.info(f"🔍 USER PREFS SAVE: Setting {key} = {value}")
            user.user_preferences[key] = value
        
        # Mark the user_preferences field as dirty so SQLAlchemy detects the change
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(user, 'user_preferences')
        
        people_logger.info(f"🔍 USER PREFS SAVE: Before commit - preferences: {user.user_preferences}")
        
        try:
            db.session.commit()
            people_logger.info(f"🔍 USER PREFS SAVE: After commit - preferences: {user.user_preferences}")
        except Exception as e:
            people_logger.error(f"🔍 USER PREFS SAVE: Database commit error: {e}")
            db.session.rollback()
            return jsonify({'error': f'Database error: {str(e)}'}), 500
        
        # Refresh the user object to get the latest data
        try:
            db.session.refresh(user)
            people_logger.info(f"🔍 USER PREFS SAVE: After refresh - preferences: {user.user_preferences}")
        except Exception as e:
            people_logger.error(f"🔍 USER PREFS SAVE: Database refresh error: {e}")
        
        return jsonify({
            'success': True,
            'message': 'User preferences saved successfully',
            'preferences': user.user_preferences
        })
        
    except Exception as e:
        people_logger.error(f"Error saving user preferences: {e}", exc_info=True)
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@people_bp.route('/people/share', methods=['POST'])
@jwt_required()
def share_contacts():
    """Share all contacts with selected group members"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user or not current_user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        if not data or 'user_ids' not in data:
            return jsonify({'error': 'user_ids is required'}), 400
        
        user_ids = data['user_ids']
        if not isinstance(user_ids, list) or len(user_ids) == 0:
            return jsonify({'error': 'user_ids must be a non-empty list'}), 400
        
        # Check if sharing a single contact, filtered contacts, or all contacts
        contact_id = data.get('contact_id')
        contact_ids = data.get('contact_ids')  # New: list of contact IDs to share
        
        if contact_id:
            # Share single contact
            contact = Person.query.filter(
                Person.id == contact_id,
                Person.owner_id == current_user_id
            ).first()
            if not contact:
                return jsonify({'error': 'Contact not found'}), 404
            contacts = [contact]
        elif 'contact_ids' in data:
            # Share filtered contacts (specific contact IDs) - even if empty list
            if isinstance(contact_ids, list):
                if len(contact_ids) > 0:
                    contacts = Person.query.filter(
                        Person.id.in_(contact_ids),
                        Person.owner_id == current_user_id
                    ).all()
                else:
                    # Empty contact_ids list - share nothing
                    contacts = []
            else:
                return jsonify({'error': 'contact_ids must be a list'}), 400
        else:
            # Get all current user's contacts (fallback when no contact_ids provided)
            contacts = Person.query.filter(Person.owner_id == current_user_id).all()
        
        if not contacts:
            return jsonify({
                'success': True,
                'message': 'No contacts to share',
                'shared_count': 0
            })
        
        # Get current user's name for source field
        sharer_name = current_user.full_name or current_user.email
        
        shared_count = 0
        
        # Share contacts with each selected user
        for user_id in user_ids:
            # user_id might be a custom ID from group members, try to find user by ID first
            target_user = User.query.get(user_id)
            
            # If not found by ID, try to find by email (in case it's a custom group member ID)
            if not target_user:
                # Extract email from custom ID format or treat as email directly
                if '_' in user_id:
                    # Custom ID format: "user_id_email_index"
                    email = user_id.split('_')[1] if len(user_id.split('_')) > 1 else user_id
                else:
                    email = user_id
                
                target_user = User.query.filter_by(email=email).first()
            
            if not target_user:
                people_logger.warning(f"User {user_id} not found, skipping")
                continue
            
            people_logger.info(f"Sharing {len(contacts)} contacts with user {target_user.email}")
            
            # Copy each contact to the target user
            for contact in contacts:
                # Check if contact already exists for target user
                # Use email if available, otherwise use first_name + last_name combination
                if contact.email and contact.email.strip():
                    existing_contact = Person.query.filter(
                        Person.owner_id == target_user.id,
                        Person.email == contact.email
                    ).first()
                else:
                    # For contacts without email, use first_name + last_name as unique identifier
                    existing_contact = Person.query.filter(
                        Person.owner_id == target_user.id,
                        Person.first_name == contact.first_name,
                        Person.last_name == contact.last_name,
                        Person.email == contact.email  # Also check email is empty
                    ).first()
                
                if existing_contact:
                    # Update existing contact's source
                    existing_contact.source = f"{sharer_name} Sharing"
                    existing_contact.updated_at = datetime.utcnow()
                    shared_count += 1
                    people_logger.info(f"Updated existing contact: {contact.first_name} {contact.last_name}")
                else:
                    # Create new contact for target user
                    new_contact = Person(
                        owner_id=target_user.id,
                        first_name=contact.first_name,
                        last_name=contact.last_name,
                        email=contact.email,
                        phone=contact.phone,
                        organization=contact.organization,
                        job_title=contact.job_title,
                        status=contact.status,
                        priority=contact.priority,
                        notes=contact.notes,
                        source=f"{sharer_name} Sharing",  # Set source to sharer's name
                        custom_fields=contact.custom_fields,
                        created_at=datetime.utcnow(),
                        updated_at=datetime.utcnow()
                    )
                    db.session.add(new_contact)
                    shared_count += 1
                    people_logger.info(f"Created new contact: {contact.first_name} {contact.last_name}")
        
        try:
            db.session.commit()
            people_logger.info(f"Successfully committed {shared_count} contact operations")
        except Exception as e:
            db.session.rollback()
            people_logger.error(f"Failed to commit contact sharing: {e}")
            return jsonify({'error': f'Failed to save shared contacts: {str(e)}'}), 500
        
        people_logger.info(f"Shared {shared_count} contacts with {len(user_ids)} users")
        
        return jsonify({
            'success': True,
            'message': f'Successfully shared {shared_count} contacts',
            'shared_count': shared_count,
            'target_users': len(user_ids)
        })
        
    except Exception as e:
        people_logger.error(f"Error sharing contacts: {e}", exc_info=True)
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
