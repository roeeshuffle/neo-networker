from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from dal.models import Person, User
from dal.database import db
from datetime import datetime
import uuid
import csv
import io

csv_bp = Blueprint('csv', __name__)

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
        
        # Default column mapping for new schema with legacy support
        default_mapping = {
            # New schema fields
            'First Name': 'first_name',
            'first name': 'first_name',
            'firstname': 'first_name',
            'first_name': 'first_name',
            'Last Name': 'last_name',
            'last name': 'last_name',
            'lastname': 'last_name',
            'last_name': 'last_name',
            'Email': 'email',
            'email': 'email',
            'e-mail': 'email',
            'E-mail': 'email',
            'Organization': 'organization',
            'organization': 'organization',
            'org': 'organization',
            'Job Title': 'job_title',
            'job title': 'job_title',
            'job_title': 'job_title',
            'title': 'job_title',
            'position': 'job_title',
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
            'LinkedIn': 'linkedin_url',
            'linkedin': 'linkedin_url',
            'linkedin_url': 'linkedin_url',
            'linkedin_profile': 'linkedin_url',
            'LinkedIn Profile': 'linkedin_url',
            'Status': 'status',
            'status': 'status',
            'state': 'status',
            'Notes': 'notes',
            'notes': 'notes',
            'description': 'notes',
            'comments': 'notes',
            'Tags': 'tags',
            'tags': 'tags',
            'Source': 'source',
            'source': 'source',
            'origin': 'source',
            'Priority': 'priority',
            'priority': 'priority',
            'importance': 'priority',
            'Group': 'group',
            'group': 'group',
            'category': 'group',
            'type': 'group',
            
            # Legacy field mappings
            'Full Name': 'full_name_legacy',  # Special handling for splitting
            'full name': 'full_name_legacy',
            'fullname': 'full_name_legacy',
            'name': 'full_name_legacy',
            'Record': 'full_name_legacy',
            'Company': 'organization',  # Map Company to Organization
            'company': 'organization',
            'Categories': 'tags',  # Map Categories to Tags
            'categories': 'tags',
            'category': 'tags',
            'Newsletter': 'newsletter_legacy',  # Legacy field
            'newsletter': 'newsletter_legacy',
            'POC in Apex': 'poc_in_apex_legacy',
            'poc in apex': 'poc_in_apex_legacy',
            'poc_in_apex': 'poc_in_apex_legacy',
            'Who Warm Intro': 'who_warm_intro_legacy',
            'who warm intro': 'who_warm_intro_legacy',
            'who_warm_intro': 'who_warm_intro_legacy',
            'Agenda': 'agenda_legacy',
            'agenda': 'agenda_legacy',
            'Meeting Notes': 'meeting_notes_legacy',
            'meeting notes': 'meeting_notes_legacy',
            'meeting_notes': 'meeting_notes_legacy',
            'Should Avishag Meet': 'should_avishag_meet_legacy',
            'should avishag meet': 'should_avishag_meet_legacy',
            'should_avishag_meet': 'should_avishag_meet_legacy',
            'More Info': 'more_info_legacy',
            'more info': 'more_info_legacy',
            'more_info': 'more_info_legacy'
        }
        
        # Merge with custom mapping
        column_mapping = {**default_mapping, **custom_mapping}
        
        created_people = []
        error_records = []
        
        for row_num, row in enumerate(reader, start=2):  # Start at 2 because row 1 is header
            person_data = {}
            custom_fields = {}
            row_errors = []
            
            for csv_column, db_column in column_mapping.items():
                if csv_column in row and row[csv_column]:
                    value = row[csv_column].strip()
                    
                    # Handle legacy fields that need special processing
                    if db_column == 'full_name_legacy':
                        # Split full name into first and last name
                        name_parts = value.split(' ', 1)
                        if len(name_parts) >= 1:
                            person_data['first_name'] = name_parts[0]
                        if len(name_parts) >= 2:
                            person_data['last_name'] = name_parts[1]
                    elif db_column.endswith('_legacy'):
                        # Store legacy fields in custom_fields
                        legacy_key = db_column.replace('_legacy', '')
                        custom_fields[legacy_key] = value
                    else:
                        # Handle new schema fields
                        if db_column in ['first_name', 'last_name', 'organization', 'job_title', 'phone', 'mobile', 'address', 'linkedin_url', 'notes', 'tags', 'source', 'priority', 'group']:
                            # Truncate long values based on field constraints
                            if len(value) > 255:
                                person_data[db_column] = value[:255]
                                row_errors.append(f"{db_column} truncated from {len(value)} to 255 characters")
                            else:
                                person_data[db_column] = value
                        elif db_column == 'email':
                            if len(value) > 255:
                                person_data[db_column] = value[:255]
                                row_errors.append(f"email truncated from {len(value)} to 255 characters")
                            else:
                                person_data[db_column] = value
                        elif db_column == 'status':
                            if len(value) > 20:
                                person_data[db_column] = value[:20]
                                row_errors.append(f"status truncated from {len(value)} to 20 characters")
                            else:
                                person_data[db_column] = value
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
