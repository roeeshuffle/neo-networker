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
        current_user = User.query.get(current_user_id)
        
        if not current_user or not current_user.is_approved:
            return jsonify({'error': 'Unauthorized'}), 403
        
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
        print(f"Error fetching notifications: {e}")
        return jsonify({'error': 'Failed to fetch notifications'}), 500

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
