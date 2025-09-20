from models import User, db
from datetime import datetime
import uuid

class AuthService:
    @staticmethod
    def create_user(email, full_name=None, is_approved=False):
        """Create a new user"""
        # Check if user already exists
        if User.query.filter_by(email=email).first():
            raise ValueError('User already exists')
        
        # Auto-approve admin users
        if email in ['guy@wershuffle.com', 'roee2912@gmail.com']:
            is_approved = True
        
        user = User(
            id=str(uuid.uuid4()),
            email=email,
            full_name=full_name or '',
            is_approved=is_approved
        )
        
        if is_approved:
            user.approved_at = datetime.utcnow()
            user.approved_by = user.id
        
        db.session.add(user)
        db.session.commit()
        
        return user
    
    @staticmethod
    def get_user_by_email(email):
        """Get user by email"""
        return User.query.filter_by(email=email).first()
    
    @staticmethod
    def get_user_by_id(user_id):
        """Get user by ID"""
        return User.query.get(user_id)
    
    @staticmethod
    def approve_user(user_id, approved_by_user_id):
        """Approve a user"""
        user = User.query.get(user_id)
        if not user:
            raise ValueError('User not found')
        
        user.is_approved = True
        user.approved_at = datetime.utcnow()
        user.approved_by = approved_by_user_id
        user.updated_at = datetime.utcnow()
        
        db.session.commit()
        return user
    
    @staticmethod
    def is_admin_user(user_id):
        """Check if user is admin"""
        user = User.query.get(user_id)
        if not user:
            return False
        
        return user.email in ['guy@wershuffle.com', 'roee2912@gmail.com']
    
    @staticmethod
    def get_all_users():
        """Get all users"""
        return User.query.all()
