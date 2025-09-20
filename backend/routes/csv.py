from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Person, Company, User
from database import db
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
        
        # Default column mapping
        default_mapping = {
            'Full Name': 'full_name',
            'Record': 'full_name',  # Map Record to full_name
            'Company': 'company',
            'Email': 'email',
            'Categories': 'categories',
            'Status': 'status',
            'LinkedIn Profile': 'linkedin_profile',
            'LinkedIn': 'linkedin_profile',  # Map LinkedIn to linkedin_profile
            'Job title': 'job_title',  # Add job title mapping
            'Tags': 'tags',  # Add tags mapping
            'ZOG': 'zog',  # Add ZOG mapping
            'Intel 144': 'intel_144',  # Add Intel 144 mapping
            'Connection strength': 'connection_strength',  # Add connection strength mapping
            'Last email interaction > When': 'last_email_interaction',  # Add last email interaction mapping
            'Created by': 'created_by',  # Add created by mapping
            'Created at': 'created_at',  # Add created at mapping
            'Primary location > Country': 'country',  # Add country mapping
            'Next due task > Due date': 'next_due_task',  # Add next due task mapping
            'POC in Apex': 'poc_in_apex',
            'Who Warm Intro': 'who_warm_intro',
            'Agenda': 'agenda',
            'Meeting Notes': 'meeting_notes',
            'Should Avishag Meet': 'should_avishag_meet',
            'More Info': 'more_info',
            'Newsletter': 'newsletter'
        }
        
        # Merge with custom mapping
        column_mapping = {**default_mapping, **custom_mapping}
        
        created_people = []
        error_records = []
        
        for row_num, row in enumerate(reader, start=2):  # Start at 2 because row 1 is header
            person_data = {}
            row_errors = []
            
            for csv_column, db_column in column_mapping.items():
                if csv_column in row and row[csv_column]:
                    value = row[csv_column].strip()
                    
                    # Handle boolean fields
                    if db_column == 'newsletter':
                        person_data[db_column] = value.lower() in ['true', '1', 'yes', 'y']
                    elif db_column == 'should_avishag_meet':
                        person_data[db_column] = value.lower() in ['true', '1', 'yes', 'y']
                    else:
                        # Truncate long values based on field constraints
                        if db_column == 'full_name' and len(value) > 255:
                            person_data[db_column] = value[:255]
                            row_errors.append(f"full_name truncated from {len(value)} to 255 characters")
                        elif db_column == 'company' and len(value) > 255:
                            person_data[db_column] = value[:255]
                            row_errors.append(f"company truncated from {len(value)} to 255 characters")
                        elif db_column == 'email' and len(value) > 255:
                            person_data[db_column] = value[:255]
                            row_errors.append(f"email truncated from {len(value)} to 255 characters")
                        elif db_column == 'status' and len(value) > 100:
                            person_data[db_column] = value[:100]
                            row_errors.append(f"status truncated from {len(value)} to 100 characters")
                        elif db_column == 'poc_in_apex' and len(value) > 255:
                            person_data[db_column] = value[:255]
                            row_errors.append(f"poc_in_apex truncated from {len(value)} to 255 characters")
                        elif db_column == 'who_warm_intro' and len(value) > 255:
                            person_data[db_column] = value[:255]
                            row_errors.append(f"who_warm_intro truncated from {len(value)} to 255 characters")
                        elif db_column == 'job_title' and len(value) > 255:
                            person_data[db_column] = value[:255]
                            row_errors.append(f"job_title truncated from {len(value)} to 255 characters")
                        elif db_column == 'zog' and len(value) > 255:
                            person_data[db_column] = value[:255]
                            row_errors.append(f"zog truncated from {len(value)} to 255 characters")
                        elif db_column == 'intel_144' and len(value) > 255:
                            person_data[db_column] = value[:255]
                            row_errors.append(f"intel_144 truncated from {len(value)} to 255 characters")
                        elif db_column == 'connection_strength' and len(value) > 255:
                            person_data[db_column] = value[:255]
                            row_errors.append(f"connection_strength truncated from {len(value)} to 255 characters")
                        elif db_column == 'country' and len(value) > 255:
                            person_data[db_column] = value[:255]
                            row_errors.append(f"country truncated from {len(value)} to 255 characters")
                        else:
                            person_data[db_column] = value
            
            # Create person if we have at least a full name
            if person_data.get('full_name'):
                try:
                    # Handle datetime fields
                    last_email_interaction = None
                    if person_data.get('last_email_interaction'):
                        try:
                            last_email_interaction = datetime.fromisoformat(person_data['last_email_interaction'].replace('Z', '+00:00'))
                        except ValueError:
                            row_errors.append(f"Invalid last_email_interaction format: {person_data['last_email_interaction']}")
                    
                    next_due_task = None
                    if person_data.get('next_due_task'):
                        try:
                            next_due_task = datetime.fromisoformat(person_data['next_due_task'].replace('Z', '+00:00'))
                        except ValueError:
                            row_errors.append(f"Invalid next_due_task format: {person_data['next_due_task']}")
                    
                    person = Person(
                        id=str(uuid.uuid4()),
                        full_name=person_data['full_name'],
                        company=person_data.get('company'),
                        categories=person_data.get('categories'),
                        email=person_data.get('email'),
                        newsletter=person_data.get('newsletter', False),
                        status=person_data.get('status'),
                        linkedin_profile=person_data.get('linkedin_profile'),
                        poc_in_apex=person_data.get('poc_in_apex'),
                        who_warm_intro=person_data.get('who_warm_intro'),
                        agenda=person_data.get('agenda'),
                        meeting_notes=person_data.get('meeting_notes'),
                        should_avishag_meet=person_data.get('should_avishag_meet', False),
                        more_info=person_data.get('more_info'),
                        job_title=person_data.get('job_title'),
                        tags=person_data.get('tags'),
                        zog=person_data.get('zog'),
                        intel_144=person_data.get('intel_144'),
                        connection_strength=person_data.get('connection_strength'),
                        last_email_interaction=last_email_interaction,
                        country=person_data.get('country'),
                        next_due_task=next_due_task,
                        owner_id=current_user_id,
                        created_by=current_user_id
                    )
                    
                    db.session.add(person)
                    created_people.append(person)
                    
                    # Log any warnings for this record
                    if row_errors:
                        print(f"⚠️ Row {row_num} warnings for '{person_data['full_name']}': {', '.join(row_errors)}")
                        
                except Exception as e:
                    error_msg = f"Row {row_num} error for '{person_data.get('full_name', 'Unknown')}': {str(e)}"
                    print(f"❌ {error_msg}")
                    error_records.append({
                        'row': row_num,
                        'name': person_data.get('full_name', 'Unknown'),
                        'error': str(e),
                        'data': person_data
                    })
            else:
                print(f"⚠️ Row {row_num}: Skipped - no full_name provided")
        
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

@csv_bp.route('/company-csv-processor', methods=['POST'])
@jwt_required()
def process_company_csv():
    """Process CSV data for companies"""
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
        
        # Default column mapping for companies
        default_mapping = {
            'Company Name': 'record',
            'Tags': 'tags',
            'Categories': 'categories',
            'LinkedIn Profile': 'linkedin_profile',
            'Last Interaction': 'last_interaction',
            'Connection Strength': 'connection_strength',
            'Twitter Follower Count': 'twitter_follower_count',
            'Twitter': 'twitter',
            'Domains': 'domains',
            'Description': 'description',
            'Notion ID': 'notion_id'
        }
        
        # Merge with custom mapping
        column_mapping = {**default_mapping, **custom_mapping}
        
        created_companies = []
        
        for row in reader:
            company_data = {}
            
            for csv_column, db_column in column_mapping.items():
                if csv_column in row and row[csv_column]:
                    value = row[csv_column].strip()
                    
                    # Handle array fields
                    if db_column == 'tags' and value:
                        company_data[db_column] = [tag.strip() for tag in value.split(',')]
                    elif db_column == 'domains' and value:
                        company_data[db_column] = [domain.strip() for domain in value.split(',')]
                    # Handle integer fields
                    elif db_column == 'twitter_follower_count' and value:
                        try:
                            company_data[db_column] = int(value)
                        except ValueError:
                            pass
                    # Handle datetime fields
                    elif db_column == 'last_interaction' and value:
                        try:
                            company_data[db_column] = datetime.fromisoformat(value)
                        except ValueError:
                            pass
                    else:
                        company_data[db_column] = value
            
            # Create company if we have at least a record name
            if company_data.get('record'):
                company = Company(
                    id=str(uuid.uuid4()),
                    record=company_data['record'],
                    tags=company_data.get('tags'),
                    categories=company_data.get('categories'),
                    linkedin_profile=company_data.get('linkedin_profile'),
                    last_interaction=company_data.get('last_interaction'),
                    connection_strength=company_data.get('connection_strength'),
                    twitter_follower_count=company_data.get('twitter_follower_count'),
                    twitter=company_data.get('twitter'),
                    domains=company_data.get('domains'),
                    description=company_data.get('description'),
                    notion_id=company_data.get('notion_id'),
                    owner_id=current_user_id,
                    created_by=current_user_id
                )
                
                db.session.add(company)
                created_companies.append(company)
        
        db.session.commit()
        
        return jsonify({
            'message': f'Successfully created {len(created_companies)} companies',
            'companies': [company.to_dict() for company in created_companies]
        })
        
    except Exception as e:
        import traceback
        print(f"Error processing CSV: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500
