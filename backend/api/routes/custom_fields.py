from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from dal.models import User
from dal.database import db

custom_fields_bp = Blueprint('custom_fields', __name__)

@custom_fields_bp.route('/custom-fields', methods=['GET'])
@jwt_required()
def get_custom_fields():
    """Get custom field names for the current user"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Get custom fields from user preferences
        custom_fields = user.user_preferences.get('custom_fields', []) if user.user_preferences else []
        
        print(f"🔧 CUSTOM FIELD: Retrieved custom fields for user {user.email}: {custom_fields}")
        
        return jsonify({
            'success': True,
            'custom_fields': custom_fields
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@custom_fields_bp.route('/custom-fields', methods=['POST'])
@jwt_required()
def create_custom_field():
    """Create a new custom field name"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        field_name = data.get('name', '').strip()
        
        if not field_name:
            return jsonify({'error': 'Field name is required'}), 400
        
        # Initialize user preferences if not exists
        if not user.user_preferences:
            user.user_preferences = {}
        
        # Get existing custom fields
        custom_fields = user.user_preferences.get('custom_fields', [])
        
        # Check if field name already exists
        if field_name in custom_fields:
            return jsonify({'error': 'Field name already exists'}), 400
        
        # Add new field name
        custom_fields.append(field_name)
        user.user_preferences['custom_fields'] = custom_fields
        
        print(f"🔧 CUSTOM FIELD: '{field_name}' added to custom fields for user: {user.email}")
        print(f"🔧 CUSTOM FIELD: Updated user preferences: {user.user_preferences}")
        
        # Add this custom field to all existing contacts for this user
        from dal.models import Person
        existing_contacts = Person.query.filter_by(owner_id=current_user_id).all()
        
        print(f"🔧 CUSTOM FIELD: Found {len(existing_contacts)} existing contacts for user {user.email}")
        
        for contact in existing_contacts:
            if not contact.custom_fields:
                contact.custom_fields = {}
            # Initialize the new field with empty value for all contacts
            contact.custom_fields[field_name] = None
        
        db.session.commit()
        print(f"🔧 CUSTOM FIELD: Database commit successful for field '{field_name}'")
        
        return jsonify({
            'success': True,
            'custom_field': field_name,
            'message': 'Custom field created successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@custom_fields_bp.route('/custom-fields/<string:field_name>', methods=['DELETE'])
@jwt_required()
def delete_custom_field(field_name):
    """Delete a custom field name"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        if not user.user_preferences:
            return jsonify({'error': 'No custom fields found'}), 404
        
        custom_fields = user.user_preferences.get('custom_fields', [])
        
        # Check if field exists
        if field_name not in custom_fields:
            return jsonify({'error': 'Custom field not found'}), 404
        
        # Remove the field
        custom_fields.remove(field_name)
        user.user_preferences['custom_fields'] = custom_fields
        
        # Remove this custom field from all existing contacts for this user
        from dal.models import Person
        existing_contacts = Person.query.filter_by(owner_id=current_user_id).all()
        
        for contact in existing_contacts:
            if contact.custom_fields and field_name in contact.custom_fields:
                del contact.custom_fields[field_name]
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Custom field deleted successfully',
            'removed_field': field_name
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500