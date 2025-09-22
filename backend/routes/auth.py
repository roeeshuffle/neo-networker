from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
import hashlib
from models import User
from database import db
from datetime import datetime
import uuid

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        
        # Check if user already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'User already exists'}), 400
        
        # Create new user
        user = User(
            id=str(uuid.uuid4()),
            email=data['email'],
            password_hash=generate_password_hash(data['password'], method='pbkdf2:sha256'),
            full_name=data.get('full_name', ''),
            is_approved=False  # Always start as not approved
        )
        
        # Auto-approve admin users and test users
        print(f"DEBUG: User email: {user.email}")
        print(f"DEBUG: Email ends with @wershuffle.com: {user.email.endswith('@wershuffle.com')}")
        if user.email in ['guy@wershuffle.com', 'roee2912@gmail.com'] or user.email.endswith('@wershuffle.com'):
            print("DEBUG: Auto-approving user")
            user.is_approved = True
            user.approved_at = datetime.utcnow()
            user.approved_by = user.id
        else:
            print("DEBUG: User not auto-approved - waiting for admin approval")
        
        db.session.add(user)
        db.session.commit()
        
        if user.is_approved:
            # Create access token for auto-approved users
            access_token = create_access_token(identity=user.id)
            return jsonify({
                'user': user.to_dict(),
                'access_token': access_token,
                'message': 'Registration successful'
            }), 201
        else:
            # User needs admin approval
            return jsonify({
                'message': 'Registration successful. Your account is pending admin approval. Please check back later or contact an administrator.',
                'requires_approval': True
            }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user with email and password"""
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Check password
        if not user.password_hash or not check_password_hash(user.password_hash, password):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Check if user is approved
        if not user.is_approved:
            return jsonify({'error': 'Your account is pending admin approval. Please wait for approval before logging in.'}), 403
        
        # Create access token
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            'user': user.to_dict(),
            'access_token': access_token
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user info"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify(user.to_dict())
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/approve/<user_id>', methods=['POST'])
@jwt_required()
def approve_user(user_id):
    """Approve a user (admin only)"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user or not current_user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user.is_approved = True
        user.approved_at = datetime.utcnow()
        user.approved_by = current_user_id
        user.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify(user.to_dict())
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/users', methods=['GET'])
@jwt_required()
def get_all_users():
    """Get all users (admin only)"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user or not current_user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        users = User.query.all()
        return jsonify([user.to_dict() for user in users])
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/preferred-platform', methods=['POST'])
@jwt_required()
def update_preferred_platform():
    """Update user's preferred messaging platform"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        platform = data.get('preferred_messaging_platform')
        
        if platform not in ['telegram', 'whatsapp']:
            return jsonify({'error': 'Invalid platform. Must be telegram or whatsapp'}), 400
        
        user.preferred_messaging_platform = platform
        db.session.commit()
        
        return jsonify({
            'message': 'Preferred platform updated successfully',
            'preferred_messaging_platform': platform
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
