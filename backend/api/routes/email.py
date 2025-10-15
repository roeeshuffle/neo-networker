from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bl.services.email_service import email_service
import logging

logger = logging.getLogger('email_api')

email_bp = Blueprint('email', __name__)

@email_bp.route('/email/send-notification', methods=['POST'])
@jwt_required()
def send_notification_email():
    """Send notification email to a user"""
    try:
        current_user_email = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['user_email', 'notification_type', 'message']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        user_email = data['user_email']
        notification_type = data['notification_type']
        message = data['message']
        
        # Send email
        success = email_service.send_notification_email(
            user_email=user_email,
            notification_type=notification_type,
            message=message
        )
        
        if success:
            logger.info(f"Notification email sent to {user_email} by {current_user_email}")
            return jsonify({'message': 'Email sent successfully'}), 200
        else:
            logger.error(f"Failed to send notification email to {user_email}")
            return jsonify({'error': 'Failed to send email'}), 500
            
    except Exception as e:
        logger.error(f"Error sending notification email: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@email_bp.route('/email/send-bulk', methods=['POST'])
@jwt_required()
def send_bulk_email():
    """Send bulk email to multiple users"""
    try:
        current_user_email = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['user_emails', 'subject', 'message']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        user_emails = data['user_emails']
        subject = data['subject']
        message = data['message']
        
        # Validate user_emails is a list
        if not isinstance(user_emails, list):
            return jsonify({'error': 'user_emails must be a list'}), 400
        
        # Send bulk email
        success = email_service.send_bulk_email(
            user_emails=user_emails,
            subject=subject,
            message=message
        )
        
        if success:
            logger.info(f"Bulk email sent to {len(user_emails)} users by {current_user_email}")
            return jsonify({'message': f'Email sent to {len(user_emails)} users successfully'}), 200
        else:
            logger.error(f"Failed to send bulk email to {len(user_emails)} users")
            return jsonify({'error': 'Failed to send emails'}), 500
            
    except Exception as e:
        logger.error(f"Error sending bulk email: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@email_bp.route('/email/test', methods=['POST'])
@jwt_required()
def test_email():
    """Test email functionality"""
    try:
        current_user_email = get_jwt_identity()
        
        # Check if email service is configured
        if not email_service.sender_password:
            logger.warning("Email service not configured: GOOGLE_WORKSPACE_APP_PASSWORD not set")
            return jsonify({'error': 'Email service not configured. Please add GOOGLE_WORKSPACE_APP_PASSWORD environment variable.'}), 400
        
        # Send test email to current user
        success = email_service.send_notification_email(
            user_email=current_user_email,
            notification_type='general',
            message='This is a test email from Weralist to verify email functionality is working correctly.'
        )
        
        if success:
            logger.info(f"Test email sent to {current_user_email}")
            return jsonify({'message': 'Test email sent successfully'}), 200
        else:
            logger.error(f"Failed to send test email to {current_user_email}")
            return jsonify({'error': 'Failed to send test email. Check email service configuration.'}), 500
            
    except Exception as e:
        logger.error(f"Error sending test email: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500
