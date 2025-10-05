from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from dal.models import User
from dal.database import db
from datetime import datetime
import logging
from bl.services.email_service import email_service

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

@admin_bp.route('/admin/pending-users', methods=['GET'])
@jwt_required()
def get_pending_users():
    """Get pending users (admin only)"""
    try:
        current_user_id = get_jwt_identity()
        
        if not check_admin_access(current_user_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        users = User.query.filter_by(is_approved=False).order_by(User.created_at.desc()).all()
        
        user_data = []
        for user in users:
            user_data.append({
                'id': user.id,
                'email': user.email,
                'full_name': user.full_name,
                'is_approved': user.is_approved,
                'created_at': user.created_at.isoformat() if user.created_at else None,
                'approved_at': user.approved_at.isoformat() if user.approved_at else None,
                'approved_by': user.approved_by
            })
        
        return jsonify(user_data), 200
        
    except Exception as e:
        admin_logger.error(f"Error getting pending users: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500

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
            # Telegram info is now directly in User model
            user_data.append({
                'id': user.id,
                'email': user.email,
                'full_name': user.full_name,
                'is_approved': user.is_approved,
                'created_at': user.created_at.isoformat() if user.created_at else None,
                'approved_at': user.approved_at.isoformat() if user.approved_at else None,
                'approved_by': user.approved_by,
                'telegram_id': user.telegram_id,
                'whatsapp_phone_number': user.whatsapp_phone_number,
                'telegram_connected': bool(user.telegram_id)
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

@admin_bp.route('/admin/users/<user_id>/reject', methods=['POST'])
@jwt_required()
def reject_user(user_id):
    """Reject a user (admin only)"""
    try:
        current_user_id = get_jwt_identity()
        
        if not check_admin_access(current_user_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user.is_approved = False
        user.approved_by = current_user_id
        user.approved_at = datetime.utcnow()
        
        db.session.commit()
        
        admin_logger.info(f"User {user.email} rejected by admin")
        
        return jsonify({
            'message': 'User rejected successfully',
            'user': {
                'id': user.id,
                'email': user.email,
                'full_name': user.full_name,
                'is_approved': user.is_approved
            }
        }), 200
        
    except Exception as e:
        admin_logger.error(f"Error rejecting user: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/admin/users/<user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    """Delete a user (admin only)"""
    try:
        current_user_id = get_jwt_identity()
        
        if not check_admin_access(current_user_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Don't allow admin to delete themselves
        if user.id == current_user_id:
            return jsonify({'error': 'Cannot delete your own account'}), 400
        
        db.session.delete(user)
        db.session.commit()
        
        admin_logger.info(f"User {user.email} deleted by admin")
        
        return jsonify({
            'message': 'User deleted successfully'
        }), 200
        
    except Exception as e:
        admin_logger.error(f"Error deleting user: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/admin/telegram-users', methods=['DELETE'])
@jwt_required()
def delete_all_telegram_users():
    """Delete all telegram users (admin only)"""
    try:
        current_user_id = get_jwt_identity()
        
        if not check_admin_access(current_user_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        # Clear telegram_id from all users
        users = User.query.filter(User.telegram_id.isnot(None)).all()
        deleted_count = 0
        for user in users:
            user.telegram_id = None
            user.telegram_username = None
            deleted_count += 1
        db.session.commit()
        
        return jsonify({
            'message': f'Cleared telegram connection from {deleted_count} users successfully'
        }), 200
        
    except Exception as e:
        admin_logger.error(f"Error deleting telegram users: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/admin/fix-schema', methods=['POST'])
@jwt_required()
def fix_database_schema():
    """Fix database schema issues (admin only)"""
    try:
        current_user_id = get_jwt_identity()
        
        if not check_admin_access(current_user_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        admin_logger.info("🔧 Starting database schema fix...")
        
        # Add custom_fields column if it doesn't exist
        try:
            db.engine.execute("""
                DO $$ 
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 
                        FROM information_schema.columns 
                        WHERE table_name = 'profiles' 
                        AND column_name = 'custom_fields'
                    ) THEN
                        ALTER TABLE profiles ADD COLUMN custom_fields JSON;
                        RAISE NOTICE 'Column custom_fields added to profiles table';
                    ELSE
                        RAISE NOTICE 'Column custom_fields already exists in profiles table';
                    END IF;
                END $$;
            """)
            admin_logger.info("✅ custom_fields column check/creation completed")
        except Exception as e:
            admin_logger.error(f"❌ Error with custom_fields column: {e}")
            return jsonify({'error': f'Failed to add custom_fields column: {str(e)}'}), 500
        
        # Test User model query
        try:
            user = User.query.first()
            if user:
                admin_logger.info(f"✅ User model test successful - found user: {user.email}")
            else:
                admin_logger.warning("⚠️ No users found in database")
        except Exception as e:
            admin_logger.error(f"❌ User model test failed: {e}")
            return jsonify({'error': f'User model test failed: {str(e)}'}), 500
        
        return jsonify({
            'message': 'Database schema fix completed successfully',
            'custom_fields_column': 'Added/verified',
            'user_model_test': 'Passed'
        }), 200
        
    except Exception as e:
        admin_logger.error(f"Error fixing database schema: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500
