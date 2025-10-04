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
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)

        if not user or not user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403

        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        mapping_data = request.form.get('mapping', '{}')
        mapping = json.loads(mapping_data)
        
        print(f"🔍 CSV IMPORT: Mapping: {mapping}")

        # Read file content for encoding detection
        raw_data = file.read()
        result = chardet.detect(raw_data)
        encoding = result['encoding'] if result['confidence'] > 0.5 else 'utf-8'
        
        # Reset file pointer and read with detected encoding
        file.seek(0)
        s = io.StringIO(raw_data.decode(encoding))

        df = pd.read_csv(s)
        
        imported_count = 0
        errors = []
        
        for index, row in df.iterrows():
            try:
                # Create person data from mapping
                person_data = {
                    'owner_id': current_user_id,
                    'created_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                }
                
                # Apply mapping
                for csv_column, contact_field in mapping.items():
                    if contact_field and contact_field != 'skip':
                        value = row[csv_column]
                        if pd.notna(value) and str(value).strip():
                            person_data[contact_field] = str(value).strip()
                
                # Ensure we have at least first_name
                if 'first_name' not in person_data or not person_data['first_name']:
                    person_data['first_name'] = f"Imported Contact {index + 1}"
                
                # Create person
                person = Person(**person_data)
                db.session.add(person)
                imported_count += 1
                
            except Exception as e:
                errors.append(f"Row {index + 1}: {str(e)}")
                print(f"❌ CSV IMPORT ERROR Row {index + 1}: {str(e)}")
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'imported_count': imported_count,
            'total_rows': len(df),
            'errors': errors
        })
        
    except Exception as e:
        print(f"❌ CSV IMPORT ERROR: {str(e)}")
        return jsonify({'error': str(e)}), 500
