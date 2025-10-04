from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from dal.models import Person, User
from dal.database import db
from datetime import datetime
import uuid
import csv
import io
import json

csv_bp = Blueprint('csv', __name__)

@csv_bp.route('/csv/preview', methods=['POST'])
@jwt_required()
def preview_csv():
    """Preview CSV data with warnings and allow editing before import"""
    try:
        print("🔍 CSV PREVIEW DEBUG: Starting function")
        current_user_id = get_jwt_identity()
        print(f"🔍 CSV PREVIEW DEBUG: Current user ID: {current_user_id}")
        
        current_user = User.query.get(current_user_id)
        print(f"🔍 CSV PREVIEW DEBUG: User found: {current_user is not None}")
        
        if not current_user or not current_user.is_approved:
            print(f"❌ CSV PREVIEW DEBUG: Unauthorized - user: {current_user is not None}, approved: {current_user.is_approved if current_user else 'N/A'}")
            return jsonify({'error': 'Unauthorized'}), 403
        
        print("🔍 CSV PREVIEW DEBUG: Checking request files")
        if 'file' not in request.files:
            print("❌ CSV PREVIEW DEBUG: No file provided")
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        print(f"🔍 CSV PREVIEW DEBUG: File received: {file.filename}")
        
        if file.filename == '':
            print("❌ CSV PREVIEW DEBUG: No file selected")
            return jsonify({'error': 'No file selected'}), 400
        
        if not file.filename.endswith('.csv'):
            print("❌ CSV PREVIEW DEBUG: File is not CSV")
            return jsonify({'error': 'File must be a CSV'}), 400
        
        # Get custom mapping from request
        custom_mapping_raw = request.form.get('custom_mapping', '{}')
        print(f"🔍 CSV PREVIEW DEBUG: Raw custom mapping: {custom_mapping_raw}")
        
        try:
            custom_mapping = json.loads(custom_mapping_raw)
            print(f"🔍 CSV PREVIEW DEBUG: Parsed custom mapping: {custom_mapping}")
        except json.JSONDecodeError as e:
            print(f"❌ CSV PREVIEW DEBUG: JSON decode error: {str(e)}")
            custom_mapping = {}
        
        # Add logging for debugging
        print(f"📊 Starting CSV preview for user {current_user_id}")
        print(f"📋 Custom mapping: {custom_mapping}")
        
        # Read and parse CSV
        print("🔍 CSV PREVIEW DEBUG: Reading file content")
        file.seek(0)  # Reset file pointer
        content = file.read().decode('utf-8')
        print(f"🔍 CSV PREVIEW DEBUG: Content length: {len(content)}")
        lines = content.strip().split('\n')
        print(f"🔍 CSV PREVIEW DEBUG: Number of lines: {len(lines)}")
        
        # Detect delimiter
        if '\t' in lines[0]:
            delimiter = '\t'
        else:
            delimiter = ','
        print(f"🔍 CSV PREVIEW DEBUG: Using delimiter: '{delimiter}'")
        
        reader = csv.DictReader(lines, delimiter=delimiter)
        print(f"🔍 CSV PREVIEW DEBUG: CSV fieldnames: {reader.fieldnames}")
        print(f"🔍 CSV PREVIEW DEBUG: First line: {lines[0] if lines else 'No lines'}")
        
        # Default column mapping for new schema only
        default_mapping = {
            # Core Identifiers
            'First Name': 'first_name',
            'first name': 'first_name',
            'firstname': 'first_name',
            'first_name': 'first_name',
            'Full Name': 'first_name',  # Map full name to first_name
            'full name': 'first_name',
            'fullname': 'first_name',
            'name': 'first_name',
            'Last Name': 'last_name',
            'last name': 'last_name',
            'lastname': 'last_name',
            'last_name': 'last_name',
            'Gender': 'gender',
            'gender': 'gender',
            'Birthday': 'birthday',
            'birthday': 'birthday',
            'birth date': 'birthday',
            'date of birth': 'birthday',
            
            # Communication Info
            'Email': 'email',
            'email': 'email',
            'e-mail': 'email',
            'E-mail': 'email',
            'Phone': 'phone',
            'phone': 'phone',
            'telephone': 'phone',
            'tel': 'phone',
            'Mobile': 'mobile',
            'mobile': 'mobile',
            'cell': 'mobile',
            'cellphone': 'mobile',
            'Address': 'address',
            'address': 'address',
            'location': 'address',
            
            # Professional Info
            'Organization': 'organization',
            'organization': 'organization',
            'org': 'organization',
            'Company': 'organization',
            'company': 'company',
            'Job Title': 'job_title',
            'job title': 'job_title',
            'job_title': 'job_title',
            'title': 'job_title',
            'position': 'job_title',
            'Job Status': 'job_status',
            'job status': 'job_status',
            'job_status': 'job_status',
            'employment status': 'job_status',
            
            # Social & Online Profiles
            'LinkedIn': 'linkedin_url',
            'linkedin': 'linkedin_url',
            'linkedin_url': 'linkedin_url',
            'linkedin_profile': 'linkedin_url',
            'LinkedIn Profile': 'linkedin_url',
            'GitHub': 'github_url',
            'github': 'github_url',
            'github_url': 'github_url',
            'Facebook': 'facebook_url',
            'facebook': 'facebook_url',
            'facebook_url': 'facebook_url',
            'Twitter': 'twitter_url',
            'twitter': 'twitter_url',
            'twitter_url': 'twitter_url',
            'Website': 'website_url',
            'website': 'website_url',
            'website_url': 'website_url',
            'web': 'website_url',
            
            # Connection Management
            'Notes': 'notes',
            'notes': 'notes',
            'description': 'notes',
            'comments': 'notes',
            'Tags': 'tags',
            'tags': 'tags',
            'Categories': 'tags',
            'categories': 'tags',
            'category': 'tags',
            'Source': 'source',
            'source': 'source',
            'origin': 'source',
            'Last Contact Date': 'last_contact_date',
            'last contact date': 'last_contact_date',
            'last_contact_date': 'last_contact_date',
            'Next Follow-up Date': 'next_follow_up_date',
            'next follow-up date': 'next_follow_up_date',
            'next_follow_up_date': 'next_follow_up_date',
            'Status': 'status',
            'status': 'status',
            'state': 'status',
            'Priority': 'priority',
            'priority': 'priority',
            'importance': 'priority',
            'Group': 'group',
            'group': 'group',
            'type': 'group'
        }
        
        # Merge with custom mapping
        column_mapping = {**default_mapping, **custom_mapping}
        
        preview_data = []
        all_warnings = []
        
        for row_num, row in enumerate(reader, start=2):  # Start at 2 because row 1 is header
            person_data = {}
            row_warnings = []
            
            for csv_column, db_column in column_mapping.items():
                if csv_column in row and row[csv_column]:
                    value = row[csv_column].strip()
                    
                    # Handle new schema fields with validation
                    if db_column in ['first_name', 'last_name', 'organization', 'job_title', 'phone', 'mobile', 'address', 'linkedin_url', 'github_url', 'facebook_url', 'twitter_url', 'website_url', 'notes', 'tags', 'source', 'priority', 'group']:
                        # Check for long values
                        if len(value) > 255:
                            row_warnings.append({
                                'type': 'truncation',
                                'field': db_column,
                                'original_value': value,
                                'truncated_value': value[:255],
                                'message': f"{db_column} will be truncated from {len(value)} to 255 characters"
                            })
                            person_data[db_column] = value[:255]
                        else:
                            person_data[db_column] = value
                    elif db_column == 'email':
                        if len(value) > 255:
                            row_warnings.append({
                                'type': 'truncation',
                                'field': db_column,
                                'original_value': value,
                                'truncated_value': value[:255],
                                'message': f"email will be truncated from {len(value)} to 255 characters"
                            })
                            person_data[db_column] = value[:255]
                        else:
                            person_data[db_column] = value
                    elif db_column == 'status':
                        # Validate status against allowed values, allow NULL for invalid entries
                        allowed_statuses = ['active', 'inactive', 'prospect', 'client', 'partner']
                        if value.lower() not in allowed_statuses:
                            row_warnings.append({
                                'type': 'validation',
                                'field': db_column,
                                'original_value': value,
                                'corrected_value': None,
                                'message': f"status '{value}' not valid, will be set to null"
                            })
                            person_data[db_column] = None
                        else:
                            person_data[db_column] = value.lower()
                    elif db_column == 'gender':
                        # Validate gender against allowed values
                        allowed_genders = ['male', 'female', 'other']
                        if value.lower() not in allowed_genders:
                            row_warnings.append({
                                'type': 'validation',
                                'field': db_column,
                                'original_value': value,
                                'corrected_value': None,
                                'message': f"gender '{value}' not valid, will be set to null"
                            })
                            person_data[db_column] = None
                        else:
                            person_data[db_column] = value.lower()
                    elif db_column == 'job_status':
                        # Validate job_status against allowed values
                        allowed_job_statuses = ['employed', 'unemployed', 'student', 'retired', 'other']
                        if value.lower() not in allowed_job_statuses:
                            row_warnings.append({
                                'type': 'validation',
                                'field': db_column,
                                'original_value': value,
                                'corrected_value': None,
                                'message': f"job_status '{value}' not valid, will be set to null"
                            })
                            person_data[db_column] = None
                        else:
                            person_data[db_column] = value.lower()
                    elif db_column == 'priority':
                        # Validate priority against allowed values
                        allowed_priorities = ['low', 'medium', 'high']
                        if value.lower() not in allowed_priorities:
                            row_warnings.append({
                                'type': 'validation',
                                'field': db_column,
                                'original_value': value,
                                'corrected_value': 'medium',
                                'message': f"priority '{value}' not valid, will be set to 'medium'"
                            })
                            person_data[db_column] = 'medium'
                        else:
                            person_data[db_column] = value.lower()
                    else:
                        person_data[db_column] = value
            
            # Check if we have at least a first name or last name
            if person_data.get('first_name') or person_data.get('last_name'):
                preview_data.append({
                    'row_number': row_num,
                    'data': person_data,
                    'warnings': row_warnings,
                    'full_name': f"{person_data.get('first_name', '')} {person_data.get('last_name', '')}".strip()
                })
                all_warnings.extend(row_warnings)
            else:
                all_warnings.append({
                    'type': 'missing_data',
                    'field': 'name',
                    'original_value': '',
                    'corrected_value': '',
                    'message': f"Row {row_num}: Skipped - no first_name or last_name provided"
                })
        
        
        print(f"🔍 CSV PREVIEW DEBUG: About to return - preview_data count: {len(preview_data)}, warnings count: {len(all_warnings)}")
        print(f"🔍 CSV PREVIEW DEBUG: First preview item: {preview_data[0] if preview_data else 'No data'}")
        
        return jsonify({
            'success': True,
            'preview_data': preview_data,
            'all_warnings': all_warnings,
            'total_rows': len(preview_data),
            'warnings_count': len(all_warnings)
        })
        
    except Exception as e:
        print(f"❌ Error previewing CSV: {str(e)}")
        print(f"🔍 Error type: {type(e).__name__}")
        import traceback
        print(f"Stack trace: {traceback.format_exc()}")
        return jsonify({'error': str(e), 'details': 'Check server logs for more information'}), 500

@csv_bp.route('/csv-processor', methods=['POST'])
@jwt_required()
def process_csv():
    """Process CSV data for people"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user or not current_user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        csv_data = data.get('csvData')
        custom_mapping = data.get('customMapping', {})
        
        if not csv_data:
            return jsonify({'error': 'CSV data is required'}), 400
        
        # Parse CSV data - detect delimiter (comma or tab)
        lines = csv_data.strip().split('\n')
        if '\t' in lines[0]:
            delimiter = '\t'
        else:
            delimiter = ','
        reader = csv.DictReader(lines, delimiter=delimiter)
        
        # Default column mapping for new schema only
        default_mapping = {
            # Core Identifiers
            'First Name': 'first_name',
            'first name': 'first_name',
            'firstname': 'first_name',
            'first_name': 'first_name',
            'Last Name': 'last_name',
            'last name': 'last_name',
            'lastname': 'last_name',
            'last_name': 'last_name',
            'Gender': 'gender',
            'gender': 'gender',
            'Birthday': 'birthday',
            'birthday': 'birthday',
            'birth date': 'birthday',
            'date of birth': 'birthday',
            
            # Communication Info
            'Email': 'email',
            'email': 'email',
            'e-mail': 'email',
            'E-mail': 'email',
            'Phone': 'phone',
            'phone': 'phone',
            'telephone': 'phone',
            'tel': 'phone',
            'Mobile': 'mobile',
            'mobile': 'mobile',
            'cell': 'mobile',
            'cellphone': 'mobile',
            'Address': 'address',
            'address': 'address',
            'location': 'address',
            
            # Professional Info
            'Organization': 'organization',
            'organization': 'organization',
            'org': 'organization',
            'Company': 'organization',
            'company': 'company',
            'Job Title': 'job_title',
            'job title': 'job_title',
            'job_title': 'job_title',
            'title': 'job_title',
            'position': 'job_title',
            'Job Status': 'job_status',
            'job status': 'job_status',
            'job_status': 'job_status',
            'employment status': 'job_status',
            
            # Social & Online Profiles
            'LinkedIn': 'linkedin_url',
            'linkedin': 'linkedin_url',
            'linkedin_url': 'linkedin_url',
            'linkedin_profile': 'linkedin_url',
            'LinkedIn Profile': 'linkedin_url',
            'GitHub': 'github_url',
            'github': 'github_url',
            'github_url': 'github_url',
            'Facebook': 'facebook_url',
            'facebook': 'facebook_url',
            'facebook_url': 'facebook_url',
            'Twitter': 'twitter_url',
            'twitter': 'twitter_url',
            'twitter_url': 'twitter_url',
            'Website': 'website_url',
            'website': 'website_url',
            'website_url': 'website_url',
            'web': 'website_url',
            
            # Connection Management
            'Notes': 'notes',
            'notes': 'notes',
            'description': 'notes',
            'comments': 'notes',
            'Tags': 'tags',
            'tags': 'tags',
            'categories': 'tags',
            'category': 'tags',
            'Categories': 'tags',
            'Source': 'source',
            'source': 'source',
            'origin': 'source',
            'Last Contact Date': 'last_contact_date',
            'last contact date': 'last_contact_date',
            'last_contact_date': 'last_contact_date',
            'Next Follow-up Date': 'next_follow_up_date',
            'next follow-up date': 'next_follow_up_date',
            'next_follow_up_date': 'next_follow_up_date',
            'Status': 'status',
            'status': 'status',
            'state': 'status',
            'Priority': 'priority',
            'priority': 'priority',
            'importance': 'priority',
            'Group': 'group',
            'group': 'group',
            'type': 'group'
        }
        
        # Merge with custom mapping
        column_mapping = {**default_mapping, **custom_mapping}
        
        created_people = []
        error_records = []
        
        for row_num, row in enumerate(reader, start=2):  # Start at 2 because row 1 is header
            person_data = {}
            custom_fields = {}
            row_warnings = []
            
            for csv_column, db_column in column_mapping.items():
                if csv_column in row and row[csv_column]:
                    value = row[csv_column].strip()
                    
                    # Handle new schema fields with validation
                    if db_column in ['first_name', 'last_name', 'organization', 'job_title', 'phone', 'mobile', 'address', 'linkedin_url', 'github_url', 'facebook_url', 'twitter_url', 'website_url', 'notes', 'tags', 'source', 'priority', 'group']:
                        # Truncate long values based on field constraints
                        if len(value) > 255:
                            person_data[db_column] = value[:255]
                            row_warnings.append(f"{db_column} truncated from {len(value)} to 255 characters")
                        else:
                            person_data[db_column] = value
                    elif db_column == 'email':
                        if len(value) > 255:
                            person_data[db_column] = value[:255]
                            row_warnings.append(f"email truncated from {len(value)} to 255 characters")
                        else:
                            person_data[db_column] = value
                    elif db_column == 'status':
                        # Validate status against allowed values
                        allowed_statuses = ['active', 'inactive', 'prospect', 'client', 'partner']
                        if value.lower() not in allowed_statuses:
                            if len(value) > 20:
                                person_data[db_column] = 'active'  # Default to active
                                row_warnings.append(f"status '{value}' not valid, set to 'active' (was {len(value)} chars)")
                            else:
                                person_data[db_column] = 'active'
                                row_warnings.append(f"status '{value}' not valid, set to 'active'")
                        else:
                            person_data[db_column] = value.lower()
                    elif db_column == 'gender':
                        # Validate gender against allowed values
                        allowed_genders = ['male', 'female', 'other']
                        if value.lower() not in allowed_genders:
                            person_data[db_column] = None
                            row_warnings.append(f"gender '{value}' not valid, set to null")
                        else:
                            person_data[db_column] = value.lower()
                    elif db_column == 'job_status':
                        # Validate job_status against allowed values
                        allowed_job_statuses = ['employed', 'unemployed', 'student', 'retired', 'other']
                        if value.lower() not in allowed_job_statuses:
                            person_data[db_column] = None
                            row_warnings.append(f"job_status '{value}' not valid, set to null")
                        else:
                            person_data[db_column] = value.lower()
                    elif db_column == 'priority':
                        # Validate priority against allowed values
                        allowed_priorities = ['low', 'medium', 'high']
                        if value.lower() not in allowed_priorities:
                            person_data[db_column] = 'medium'  # Default to medium
                            row_warnings.append(f"priority '{value}' not valid, set to 'medium'")
                        else:
                            person_data[db_column] = value.lower()
                    else:
                        person_data[db_column] = value
            
            # Create person if we have at least a first name or last name
            if person_data.get('first_name') or person_data.get('last_name'):
                try:
                    # Set default values for required fields
                    if not person_data.get('first_name'):
                        person_data['first_name'] = ''
                    if not person_data.get('last_name'):
                        person_data['last_name'] = ''
                    if not person_data.get('status'):
                        person_data['status'] = 'active'
                    if not person_data.get('priority'):
                        person_data['priority'] = 'medium'
                    if not person_data.get('source'):
                        person_data['source'] = 'csv_import'
                    
                    person = Person(
                        first_name=person_data.get('first_name'),
                        last_name=person_data.get('last_name'),
                        email=person_data.get('email'),
                        organization=person_data.get('organization'),
                        job_title=person_data.get('job_title'),
                        phone=person_data.get('phone'),
                        mobile=person_data.get('mobile'),
                        address=person_data.get('address'),
                        linkedin_url=person_data.get('linkedin_url'),
                        notes=person_data.get('notes'),
                        tags=person_data.get('tags'),
                        source=person_data.get('source'),
                        status=person_data.get('status'),
                        priority=person_data.get('priority'),
                        group=person_data.get('group'),
                        custom_fields=custom_fields if custom_fields else None,
                        owner_id=current_user_id
                    )
                    
                    db.session.add(person)
                    created_people.append(person)
                    
                    # Log any warnings for this record
                    if row_errors:
                        full_name = f"{person_data.get('first_name', '')} {person_data.get('last_name', '')}".strip()
                        print(f"⚠️ Row {row_num} warnings for '{full_name or 'Unknown'}': {', '.join(row_errors)}")
                        
                except Exception as e:
                    full_name = f"{person_data.get('first_name', '')} {person_data.get('last_name', '')}".strip()
                    error_msg = f"Row {row_num} error for '{full_name or 'Unknown'}': {str(e)}"
                    print(f"❌ {error_msg}")
                    error_records.append({
                        'row': row_num,
                        'name': full_name or 'Unknown',
                        'error': str(e),
                        'data': person_data
                    })
            else:
                print(f"⚠️ Row {row_num}: Skipped - no first_name or last_name provided")
        
        db.session.commit()
        
        response_data = {
            'message': f'Successfully created {len(created_people)} people',
            'people': [person.to_dict() for person in created_people]
        }
        
        if error_records:
            response_data['errors'] = error_records
            response_data['message'] += f' with {len(error_records)} errors'
            print(f"📊 Summary: {len(created_people)} successful, {len(error_records)} errors")
        
        return jsonify(response_data)
        
    except Exception as e:
        import traceback
        print(f"Error processing CSV: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

# Company CSV processing removed - Company model deleted
