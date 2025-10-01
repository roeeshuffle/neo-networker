from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from dal.models import Company, User, SharedData
from dal.database import db
from datetime import datetime
import uuid

companies_bp = Blueprint('companies', __name__)

@companies_bp.route('/companies', methods=['GET'])
@jwt_required()
def get_companies():
    """Get all companies for the current user"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user or not current_user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Get companies owned by user or shared with user
        companies = Company.query.filter(
            (Company.owner_id == current_user_id) |
            (Company.id.in_(
                db.session.query(SharedData.record_id).filter(
                    SharedData.shared_with_user_id == current_user_id,
                    SharedData.table_name == 'companies'
                )
            ))
        ).order_by(Company.created_at.desc()).all()
        
        return jsonify([company.to_dict() for company in companies])
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@companies_bp.route('/companies', methods=['POST'])
@jwt_required()
def create_company():
    """Create a new company"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user or not current_user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        
        company = Company(
            id=str(uuid.uuid4()),
            record=data['record'],
            tags=data.get('tags'),
            categories=data.get('categories'),
            linkedin_profile=data.get('linkedin_profile'),
            last_interaction=datetime.fromisoformat(data['last_interaction']) if data.get('last_interaction') else None,
            connection_strength=data.get('connection_strength'),
            twitter_follower_count=data.get('twitter_follower_count'),
            twitter=data.get('twitter'),
            domains=data.get('domains'),
            description=data.get('description'),
            notion_id=data.get('notion_id'),
            owner_id=current_user_id,
            created_by=current_user_id
        )
        
        db.session.add(company)
        db.session.commit()
        
        return jsonify(company.to_dict()), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@companies_bp.route('/companies/<company_id>', methods=['PUT'])
@jwt_required()
def update_company(company_id):
    """Update a company"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user or not current_user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        company = Company.query.get(company_id)
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        
        # Check if user owns this company
        if company.owner_id != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        
        company.record = data.get('record', company.record)
        company.tags = data.get('tags', company.tags)
        company.categories = data.get('categories', company.categories)
        company.linkedin_profile = data.get('linkedin_profile', company.linkedin_profile)
        company.last_interaction = datetime.fromisoformat(data['last_interaction']) if data.get('last_interaction') else company.last_interaction
        company.connection_strength = data.get('connection_strength', company.connection_strength)
        company.twitter_follower_count = data.get('twitter_follower_count', company.twitter_follower_count)
        company.twitter = data.get('twitter', company.twitter)
        company.domains = data.get('domains', company.domains)
        company.description = data.get('description', company.description)
        company.notion_id = data.get('notion_id', company.notion_id)
        company.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify(company.to_dict())
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@companies_bp.route('/companies/<company_id>', methods=['DELETE'])
@jwt_required()
def delete_company(company_id):
    """Delete a company"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user or not current_user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        company = Company.query.get(company_id)
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        
        # Check if user owns this company
        if company.owner_id != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        db.session.delete(company)
        db.session.commit()
        
        return jsonify({'message': 'Company deleted successfully'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@companies_bp.route('/companies/<company_id>/share', methods=['POST'])
@jwt_required()
def share_company(company_id):
    """Share a company with another user"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user or not current_user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        company = Company.query.get(company_id)
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        
        # Check if user owns this company
        if company.owner_id != current_user_id:
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
            table_name='companies',
            record_id=company_id
        )
        
        db.session.add(shared_data)
        db.session.commit()
        
        return jsonify(shared_data.to_dict()), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
