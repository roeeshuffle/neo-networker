from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User, TelegramUser
from database import db
from datetime import datetime
import logging
from services.email_service import email_service

admin_bp = Blueprint('admin', __name__)
admin_logger = logging.getLogger('admin')

def check_admin_access(user_id):
    """Check if user has admin access"""
    user = User.query.get(user_id)
    if not user or not user.is_approved:
        return False
    
    # Check if user is in admin list
    admin_emails = ['guy@wershuffle.com', 'roee2912@gmail.com']
    return user.email in admin_emails

@admin_bp.route('/admin/users', methods=['GET'])
@jwt_required()
def get_all_users():
    """Get all users (admin only)"""
    try:
        current_user_id = get_jwt_identity()
        
        if not check_admin_access(current_user_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        users = User.query.order_by(User.created_at.desc()).all()
        
        # Get telegram users for each user
        user_data = []
        for user in users:
            telegram_user = TelegramUser.query.filter_by(user_id=user.id).first()
            user_data.append({
                'id': user.id,
                'email': user.email,
                'full_name': user.full_name,
                'is_approved': user.is_approved,
                'created_at': user.created_at.isoformat() if user.created_at else None,
                'approved_at': user.approved_at.isoformat() if user.approved_at else None,
                'approved_by': user.approved_by,
                'telegram_id': telegram_user.telegram_id if telegram_user else None,
                'telegram_connected': telegram_user.is_authenticated if telegram_user else False
            })
        
        return jsonify(user_data), 200
        
    except Exception as e:
        admin_logger.error(f"Error getting all users: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/admin/users/<user_id>/approve', methods=['POST'])
@jwt_required()
def approve_user(user_id):
    """Approve or deny a user (admin only)"""
    try:
        current_user_id = get_jwt_identity()
        
        if not check_admin_access(current_user_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.get_json()
        approved = data.get('approved', False)
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user.is_approved = approved
        user.approved_by = current_user_id
        user.approved_at = datetime.utcnow()
        
        db.session.commit()
        
        # Send email notification (disabled for now)
        # try:
        #     if approved:
        #         email_service.send_approval_notification(user.email, user.full_name or user.email)
        #     else:
        #         email_service.send_rejection_notification(user.email, user.full_name or user.email)
        # except Exception as e:
        #     admin_logger.error(f"Error sending email notification: {e}")
        
        # Log approval/rejection for now
        admin_logger.info(f"User {user.email} {'approved' if approved else 'rejected'} by admin")
        
        return jsonify({
            'message': f'User {"approved" if approved else "denied"} successfully',
            'user': {
                'id': user.id,
                'email': user.email,
                'full_name': user.full_name,
                'is_approved': user.is_approved
            }
        }), 200
        
    except Exception as e:
        admin_logger.error(f"Error approving user: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/admin/telegram-users', methods=['DELETE'])
@jwt_required()
def delete_all_telegram_users():
    """Delete all telegram users (admin only)"""
    try:
        current_user_id = get_jwt_identity()
        
        if not check_admin_access(current_user_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        # Delete all telegram users
        deleted_count = TelegramUser.query.delete()
        db.session.commit()
        
        return jsonify({
            'message': f'Deleted {deleted_count} telegram users successfully'
        }), 200
        
    except Exception as e:
        admin_logger.error(f"Error deleting telegram users: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500
