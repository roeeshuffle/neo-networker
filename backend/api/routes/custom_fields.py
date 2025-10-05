from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from dal.models import User
from dal.database import db
import json
from datetime import datetime

custom_fields_bp = Blueprint('custom_fields', __name__)

@custom_fields_bp.route('/custom-fields', methods=['GET'])
@jwt_required()
def get_custom_fields():
    """Get custom field definitions for the current user"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Get custom fields from user preferences and custom_fields column
        custom_fields_from_preferences = user.user_preferences.get('custom_fields', []) if user.user_preferences else []
        # custom_fields_from_column = user.custom_fields if user.custom_fields else []  # Temporarily disabled
        
        # Use only user_preferences for now
        all_custom_fields = custom_fields_from_preferences.copy()
        
        # Add fields from custom_fields column that aren't already in preferences
        # for field in custom_fields_from_column:  # Temporarily disabled
        #     if not any(f['key'] == field.get('key') for f in all_custom_fields):
        #         all_custom_fields.append(field)
        
        
        return jsonify({
            'success': True,
            'custom_fields': all_custom_fields
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@custom_fields_bp.route('/custom-fields', methods=['POST'])
@jwt_required()
def create_custom_field():
    """Create a new custom field definition"""
    try:
        
        # Get existing custom fields
        custom_fields = user.user_preferences.get('custom_fields', [])
        
        
        # Create new field definition
        new_field = {
            'id': len(custom_fields) + 1,  # Simple ID generation
            'name': field_name,
            'key': field_key,
            'type': field_type,
            'options': field_options if field_type == 'select' else [],
            'created_at': datetime.utcnow().isoformat()
        }
        
        # Add to custom fields
        custom_fields.append(new_field)
        user.user_preferences['custom_fields'] = custom_fields
        
        # Add this custom field to all existing contacts for this user
        from dal.models import Person
        existing_contacts = Person.query.filter_by(owner_id=current_user_id).all()
        
        for contact in existing_contacts:
            if not contact.custom_fields:
                contact.custom_fields = {}
            # Initialize the new field with empty value for all contacts
            contact.custom_fields[field_key] = None
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'custom_field': new_field,
            'message': 'Custom field created successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@custom_fields_bp.route('/custom-fields/<int:field_id>', methods=['PUT'])
@jwt_required()
def update_custom_field(field_id):
    """Update a custom field definition"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        field_name = data.get('name')
        field_type = data.get('type')
        field_options = data.get('options', [])
        
        if not user.user_preferences:
            return jsonify({'error': 'No custom fields found'}), 404
        
        custom_fields = user.user_preferences.get('custom_fields', [])
        
        # Find the field to update
        field_index = None
        for i, field in enumerate(custom_fields):
            if field['id'] == field_id:
                field_index = i
                break
        
        if field_index is None:
            return jsonify({'error': 'Custom field not found'}), 404
        
        # Update the field
        if field_name:
            custom_fields[field_index]['name'] = field_name
        if field_type:
            custom_fields[field_index]['type'] = field_type
        if field_options is not None:
            custom_fields[field_index]['options'] = field_options
        
        custom_fields[field_index]['updated_at'] = db.func.now().isoformat()
        
        user.user_preferences['custom_fields'] = custom_fields
        db.session.commit()
        
        return jsonify({
            'success': True,
            'custom_field': custom_fields[field_index],
            'message': 'Custom field updated successfully'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@custom_fields_bp.route('/custom-fields/<int:field_id>', methods=['DELETE'])
@jwt_required()
def delete_custom_field(field_id):
    """Delete a custom field definition"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        if not user.user_preferences:
            return jsonify({'error': 'No custom fields found'}), 404
        
        custom_fields = user.user_preferences.get('custom_fields', [])
        
        # Find and remove the field
        field_index = None
        for i, field in enumerate(custom_fields):
            if field['id'] == field_id:
                field_index = i
                break
        
        if field_index is None:
            return jsonify({'error': 'Custom field not found'}), 404
        
        removed_field = custom_fields.pop(field_index)
        
        # Remove this custom field from all existing contacts for this user
        from dal.models import Person
        existing_contacts = Person.query.filter_by(owner_id=current_user_id).all()
        
        for contact in existing_contacts:
            if contact.custom_fields and removed_field['key'] in contact.custom_fields:
                del contact.custom_fields[removed_field['key']]
        
        user.user_preferences['custom_fields'] = custom_fields
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Custom field deleted successfully',
            'removed_field': removed_field
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@custom_fields_bp.route('/table-columns', methods=['GET'])
@jwt_required()
def get_table_columns():
    """Get table column configuration for the current user"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Get table columns from user preferences
        table_columns = user.user_preferences.get('table_columns', {
            'standard': ['first_name', 'last_name', 'organization', 'job_title', 'status'],
            'custom': []
        }) if user.user_preferences else {
            'standard': ['first_name', 'last_name', 'organization', 'job_title', 'status'],
            'custom': []
        }
        
        return jsonify({
            'success': True,
            'table_columns': table_columns
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@custom_fields_bp.route('/table-columns', methods=['POST'])
@jwt_required()
def update_table_columns():
    """Update table column configuration for the current user"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        standard_columns = data.get('standard', [])
        custom_columns = data.get('custom', [])
        
        # Initialize user preferences if not exists
        if not user.user_preferences:
            user.user_preferences = {}
        
        # Update table columns
        user.user_preferences['table_columns'] = {
            'standard': standard_columns,
            'custom': custom_columns
        }
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Table columns updated successfully',
            'table_columns': user.user_preferences['table_columns']
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
