from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from dal.database import db
from dal.models import Notification, User
from datetime import datetime

notifications_bp = Blueprint('notifications', __name__)

@notifications_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    """Get the latest 10 notifications for the authenticated user"""
    try:
        current_user_id = get_jwt_identity()
        print(f"🔔 NOTIFICATIONS DEBUG: Current user ID from JWT: {current_user_id}")
        
        current_user = User.query.get(current_user_id)
        print(f"🔔 NOTIFICATIONS DEBUG: User query result: {current_user}")
        
        if not current_user:
            print(f"🔔 NOTIFICATIONS DEBUG: User not found for ID: {current_user_id}")
            return jsonify({'error': 'User not found'}), 404
            
        if not current_user.is_approved:
            print(f"🔔 NOTIFICATIONS DEBUG: User not approved: {current_user.email}")
            return jsonify({'error': 'Unauthorized'}), 403
        
        print(f"🔔 NOTIFICATIONS DEBUG: User found: {current_user.email}, approved: {current_user.is_approved}")
        
        # Get the latest 10 notifications for the user
        notifications = Notification.query.filter(
            Notification.user_email == current_user.email
        ).order_by(Notification.created_at.desc()).limit(10).all()
        
        print(f"🔔 Found {len(notifications)} notifications for {current_user.email}")
        for notif in notifications:
            print(f"  - {notif.notification} (type: {notif.notification_type}, seen: {notif.seen})")
        
        return jsonify({
            'notifications': [notification.to_dict() for notification in notifications],
            'count': len(notifications)
        })
        
    except Exception as e:
        print(f"🔔 NOTIFICATIONS DEBUG: Exception in get_notifications: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to fetch notifications'}), 500

@notifications_bp.route('/notifications/unread-count', methods=['GET'])
@jwt_required()
def get_unread_notifications_count():
    """Get the count of unread notifications for the authenticated user"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user or not current_user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Get the count of unread notifications for the user
        unread_count = Notification.query.filter(
            Notification.user_email == current_user.email,
            Notification.is_read == False
        ).count()
        
        print(f"🔔 Unread notifications count for {current_user.email}: {unread_count}")
        
        return jsonify({
            'unread_count': unread_count,
            'has_unread': unread_count > 0
        })
        
    except Exception as e:
        print(f"Error getting unread notifications count: {e}")
        return jsonify({'error': 'Failed to get unread notifications count'}), 500

@notifications_bp.route('/notifications/<int:notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_notification_read(notification_id):
    """Mark a notification as read"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user or not current_user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        notification = Notification.query.filter(
            Notification.id == notification_id,
            Notification.user_email == current_user.email
        ).first()
        
        if not notification:
            return jsonify({'error': 'Notification not found'}), 404
        
        notification.is_read = True
        db.session.commit()
        
        return jsonify({'message': 'Notification marked as read'})
        
    except Exception as e:
        print(f"Error marking notification as read: {e}")
        return jsonify({'error': 'Failed to mark notification as read'}), 500

@notifications_bp.route('/notifications/read-all', methods=['PUT'])
@jwt_required()
def mark_all_notifications_read():
    """Mark all notifications as read for the authenticated user"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        
        if not current_user or not current_user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Mark all unread notifications as read
        Notification.query.filter(
            Notification.user_email == current_user.email,
            Notification.is_read == False
        ).update({'is_read': True})
        
        db.session.commit()
        
        return jsonify({'message': 'All notifications marked as read'})
        
    except Exception as e:
        print(f"Error marking all notifications as read: {e}")
        return jsonify({'error': 'Failed to mark all notifications as read'}), 500
