from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from dal.models import User, Person
from dal.database import db
import pandas as pd
import io
import chardet
import json
from datetime import datetime

csv_simple_mapping_bp = Blueprint('csv_simple_mapping', __name__)

# Available contact fields for mapping
CONTACT_FIELDS = [
    # Core Identifiers
    {'key': 'first_name', 'label': 'First Name', 'required': True},
    {'key': 'last_name', 'label': 'Last Name', 'required': False},
    {'key': 'gender', 'label': 'Gender', 'required': False},
    {'key': 'birthday', 'label': 'Birthday', 'required': False},
    
    # Communication Info
    {'key': 'email', 'label': 'Email', 'required': False},
    {'key': 'phone', 'label': 'Phone', 'required': False},
    {'key': 'mobile', 'label': 'Mobile', 'required': False},
    {'key': 'address', 'label': 'Address', 'required': False},
    
    # Professional Info
    {'key': 'organization', 'label': 'Organization', 'required': False},
    {'key': 'job_title', 'label': 'Job Title', 'required': False},
    {'key': 'job_status', 'label': 'Job Status', 'required': False},
    
    # Social & Online Profiles
    {'key': 'linkedin_url', 'label': 'LinkedIn URL', 'required': False},
    {'key': 'github_url', 'label': 'GitHub URL', 'required': False},
    {'key': 'facebook_url', 'label': 'Facebook URL', 'required': False},
    {'key': 'twitter_url', 'label': 'Twitter URL', 'required': False},
    {'key': 'website_url', 'label': 'Website URL', 'required': False},
    
    # Connection Management
    {'key': 'notes', 'label': 'Notes', 'required': False},
    {'key': 'tags', 'label': 'Tags', 'required': False},
    {'key': 'source', 'label': 'Source', 'required': False},
    {'key': 'last_contact_date', 'label': 'Last Contact Date', 'required': False},
    {'key': 'next_follow_up_date', 'label': 'Next Follow-up Date', 'required': False},
    {'key': 'status', 'label': 'Status', 'required': False},
    {'key': 'priority', 'label': 'Priority', 'required': False},
    {'key': 'group', 'label': 'Group', 'required': False},
]

@csv_simple_mapping_bp.route('/csv/get-columns', methods=['POST'])
@jwt_required()
def get_csv_columns():
    """Get CSV column names for mapping"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)

        if not user or not user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403

        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        if not file.filename.endswith('.csv'):
            return jsonify({'error': 'File must be a CSV'}), 400

        # Read file content for encoding detection
        raw_data = file.read()
        result = chardet.detect(raw_data)
        encoding = result['encoding'] if result['confidence'] > 0.5 else 'utf-8'
        
        # Reset file pointer and read with detected encoding
        file.seek(0)
        s = io.StringIO(raw_data.decode(encoding))

        df = pd.read_csv(s)
        
        # Get column names
        csv_columns = list(df.columns)
        
        return jsonify({
            'success': True,
            'csv_columns': csv_columns,
            'contact_fields': CONTACT_FIELDS,
            'total_rows': len(df)
        })
        
    except Exception as e:
        print(f"❌ CSV COLUMNS ERROR: {str(e)}")
        return jsonify({'error': str(e)}), 500

@csv_simple_mapping_bp.route('/csv/import-with-mapping', methods=['POST'])
@jwt_required()
def import_csv_with_mapping():
    """Import CSV with column mapping"""
    try:
        print("🔍 CSV IMPORT DEBUG: Starting import process")
        current_user_id = get_jwt_identity()
        print(f"🔍 CSV IMPORT DEBUG: Current user ID: {current_user_id}")
        
        user = User.query.get(current_user_id)
        print(f"🔍 CSV IMPORT DEBUG: User found: {user is not None}")
        
        if not user or not user.is_approved:
            print(f"❌ CSV IMPORT DEBUG: Unauthorized - user: {user is not None}, approved: {user.is_approved if user else 'N/A'}")
            return jsonify({'error': 'Unauthorized'}), 403

        print("🔍 CSV IMPORT DEBUG: Checking request files")
        if 'file' not in request.files:
            print("❌ CSV IMPORT DEBUG: No file provided")
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        print(f"🔍 CSV IMPORT DEBUG: File received: {file.filename}")
        
        if file.filename == '':
            print("❌ CSV IMPORT DEBUG: No file selected")
            return jsonify({'error': 'No file selected'}), 400
        
        if not file.filename.endswith('.csv'):
            print("❌ CSV IMPORT DEBUG: File is not CSV")
            return jsonify({'error': 'File must be a CSV'}), 400

        mapping_data = request.form.get('mapping', '{}')
        print(f"🔍 CSV IMPORT DEBUG: Raw mapping data: {mapping_data}")
        
        try:
            mapping = json.loads(mapping_data)
            print(f"🔍 CSV IMPORT DEBUG: Parsed mapping: {mapping}")
        except json.JSONDecodeError as e:
            print(f"❌ CSV IMPORT DEBUG: JSON decode error: {str(e)}")
            return jsonify({'error': f'Invalid mapping JSON: {str(e)}'}), 400

        print("🔍 CSV IMPORT DEBUG: Reading file content")
        # Read file content for encoding detection
        raw_data = file.read()
        print(f"🔍 CSV IMPORT DEBUG: File size: {len(raw_data)} bytes")
        
        result = chardet.detect(raw_data)
        encoding = result['encoding'] if result['confidence'] > 0.5 else 'utf-8'
        print(f"🔍 CSV IMPORT DEBUG: Detected encoding: {encoding} (confidence: {result['confidence']})")
        
        # Reset file pointer and read with detected encoding
        file.seek(0)
        s = io.StringIO(raw_data.decode(encoding))

        print("🔍 CSV IMPORT DEBUG: Parsing CSV with pandas")
        df = pd.read_csv(s)
        print(f"🔍 CSV IMPORT DEBUG: CSV parsed successfully - {len(df)} rows, {len(df.columns)} columns")
        print(f"🔍 CSV IMPORT DEBUG: Columns: {list(df.columns)}")
        
        imported_count = 0
        skipped_count = 0
        errors = []
        
        print("🔍 CSV IMPORT DEBUG: Starting row processing")
        for index, row in df.iterrows():
            try:
                print(f"🔍 CSV IMPORT DEBUG: Processing row {index + 1}")
                # Create person data from mapping
                person_data = {
                    'owner_id': current_user_id,
                    'created_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                }
                custom_fields_data = {}
                
                # Apply mapping
                for csv_column, contact_field in mapping.items():
                    if contact_field and contact_field != 'skip':
                        if csv_column in row:
                            value = row[csv_column]
                            if pd.notna(value) and str(value).strip():
                                value_str = str(value).strip()
                                
                                # Handle full_name splitting with title detection
                                if contact_field == 'full_name':
                                    name_parts = value_str.split()
                                    if len(name_parts) >= 2:
                                        # Check if first part is a title
                                        first_part = name_parts[0].lower()
                                        if first_part in ['dr', 'dr.', 'prof', 'prof.', 'mr', 'mr.', 'mrs', 'mrs.', 'ms', 'ms.']:
                                            # Combine title with first name
                                            person_data['first_name'] = f"{name_parts[0]} {name_parts[1]}"
                                            person_data['last_name'] = ' '.join(name_parts[2:]) if len(name_parts) > 2 else ''
                                        else:
                                            # Regular splitting
                                            person_data['first_name'] = name_parts[0]
                                            person_data['last_name'] = ' '.join(name_parts[1:])
                                    else:
                                        # Only one part
                                        person_data['first_name'] = name_parts[0]
                                        person_data['last_name'] = ''
                                    print(f"🔍 CSV IMPORT DEBUG: Split full name '{value_str}' -> first: '{person_data['first_name']}', last: '{person_data.get('last_name', '')}'")
                                elif contact_field.startswith('custom_'):
                                    # Handle custom fields
                                    custom_field_name = contact_field.replace('custom_', '')
                                    custom_fields_data[custom_field_name] = value_str
                                    print(f"🔍 CSV IMPORT DEBUG: Mapped '{csv_column}' -> custom field '{custom_field_name}': '{value_str}'")
                                else:
                                    person_data[contact_field] = value_str
                                    print(f"🔍 CSV IMPORT DEBUG: Mapped '{csv_column}' -> '{contact_field}': '{person_data[contact_field]}'")
                        else:
                            print(f"⚠️ CSV IMPORT WARNING: Column '{csv_column}' not found in CSV")
                
                # Add custom fields to person data
                if custom_fields_data:
                    person_data['custom_fields'] = custom_fields_data
                    print(f"🔍 CSV IMPORT DEBUG: Added custom fields: {custom_fields_data}")
                
                # Ensure we have at least first_name
                if 'first_name' not in person_data or not person_data['first_name']:
                    person_data['first_name'] = f"Imported Contact {index + 1}"
                    print(f"🔍 CSV IMPORT DEBUG: Added default first_name: '{person_data['first_name']}'")
                
                print(f"🔍 CSV IMPORT DEBUG: Person data: {person_data}")
                
                # Check for existing person with same email (if email is provided)
                if person_data.get('email'):
                    existing_person = Person.query.filter_by(
                        email=person_data['email'], 
                        owner_id=current_user_id
                    ).first()
                    if existing_person:
                        print(f"⚠️ CSV IMPORT WARNING: Skipping row {index + 1} - email '{person_data['email']}' already exists")
                        skipped_count += 1
                        continue
                
                # Create person
                person = Person(**person_data)
                db.session.add(person)
                db.session.commit()  # Commit each person individually to handle duplicates gracefully
                imported_count += 1
                print(f"✅ CSV IMPORT DEBUG: Successfully added person {index + 1}")
                
            except Exception as e:
                error_msg = f"Row {index + 1}: {str(e)}"
                errors.append(error_msg)
                print(f"❌ CSV IMPORT ERROR Row {index + 1}: {str(e)}")
                import traceback
                print(f"❌ CSV IMPORT ERROR Traceback: {traceback.format_exc()}")
                db.session.rollback()  # Rollback on error
        print("✅ CSV IMPORT DEBUG: Database commit successful")
        
        result = {
            'success': True,
            'imported_count': imported_count,
            'skipped_count': skipped_count,
            'total_rows': len(df),
            'errors': errors
        }
        print(f"🔍 CSV IMPORT DEBUG: Returning result: {result}")
        return jsonify(result)
        
    except Exception as e:
        print(f"❌ CSV IMPORT ERROR: {str(e)}")
        import traceback
        print(f"❌ CSV IMPORT ERROR Traceback: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500
