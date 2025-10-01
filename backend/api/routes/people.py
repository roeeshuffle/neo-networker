from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from dal.models import Person, User, SharedData
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
        
        # Get people owned by user or shared with user
        people = Person.query.filter(
            (Person.owner_id == current_user_id) |
            (Person.id.in_(
                db.session.query(SharedData.record_id).filter(
                    SharedData.shared_with_user_id == current_user_id,
                    SharedData.table_name == 'people'
                )
            ))
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
        
        person = Person(
            id=str(uuid.uuid4()),
            full_name=data['full_name'],
            company=data.get('company'),
            categories=data.get('categories'),
            email=data.get('email'),
            newsletter=data.get('newsletter', False),
            status=data.get('status'),
            linkedin_profile=data.get('linkedin_profile'),
            poc_in_apex=data.get('poc_in_apex'),
            who_warm_intro=data.get('who_warm_intro'),
            agenda=data.get('agenda'),
            meeting_notes=data.get('meeting_notes'),
            should_avishag_meet=data.get('should_avishag_meet', False),
            more_info=data.get('more_info'),
            owner_id=current_user_id,
            created_by=current_user_id
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
        
        person.full_name = data.get('full_name', person.full_name)
        person.company = data.get('company', person.company)
        person.categories = data.get('categories', person.categories)
        person.email = data.get('email', person.email)
        person.newsletter = data.get('newsletter', person.newsletter)
        person.status = data.get('status', person.status)
        person.linkedin_profile = data.get('linkedin_profile', person.linkedin_profile)
        person.poc_in_apex = data.get('poc_in_apex', person.poc_in_apex)
        person.who_warm_intro = data.get('who_warm_intro', person.who_warm_intro)
        person.agenda = data.get('agenda', person.agenda)
        person.meeting_notes = data.get('meeting_notes', person.meeting_notes)
        person.should_avishag_meet = data.get('should_avishag_meet', person.should_avishag_meet)
        person.more_info = data.get('more_info', person.more_info)
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

@people_bp.route('/people/<person_id>/share', methods=['POST'])
@jwt_required()
def share_person(person_id):
    """Share a person with another user"""
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
        
        data = request.get_json()
        shared_with_user_id = data.get('shared_with_user_id')
        
        if not shared_with_user_id:
            return jsonify({'error': 'shared_with_user_id is required'}), 400
        
        # Check if user exists
        shared_with_user = User.query.get(shared_with_user_id)
        if not shared_with_user:
            return jsonify({'error': 'User not found'}), 404
        
        # Create shared data record
        shared_data = SharedData(
            id=str(uuid.uuid4()),
            owner_id=current_user_id,
            shared_with_user_id=shared_with_user_id,
            table_name='people',
            record_id=person_id
        )
        
        db.session.add(shared_data)
        db.session.commit()
        
        return jsonify(shared_data.to_dict()), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
