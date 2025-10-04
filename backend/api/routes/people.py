from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from dal.models import Person, User
from dal.database import db
from datetime import datetime
import uuid

people_bp = Blueprint('people', __name__)

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
        
        # Validate required fields
        if not data.get('first_name') and not data.get('last_name'):
            return jsonify({'error': 'At least first_name or last_name is required'}), 400
        
        # Helper function to clean empty strings to None for constrained fields
        def clean_constrained_field(value, allowed_values=None, default_value=None):
            if not value or value.strip() == '':
                return default_value
            if allowed_values and value.lower() not in allowed_values:
                return default_value
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
                status=clean_constrained_field(data.get('status'), ['active', 'inactive', 'prospect', 'client', 'partner']) or 'active',
                priority=clean_constrained_field(data.get('priority'), ['low', 'medium', 'high'], 'medium'),
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
