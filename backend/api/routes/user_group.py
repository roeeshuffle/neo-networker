from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from dal.database import db
from dal.models.user_group import UserGroup
from dal.models.user import User
from datetime import datetime
import re

user_group_bp = Blueprint('user_group', __name__)

@user_group_bp.route('/user-group', methods=['GET'])
@jwt_required()
def get_user_group():
    """Get all users in the current user's group"""
    try:
        current_user_id = get_jwt_identity()
        print(f"🔍 USER GROUP DEBUG: Current user ID: {current_user_id}")
        
        # Get user preferences
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        # Get group members from user preferences
        user_preferences = user.user_preferences or {}
        group_members = user_preferences.get('group_members', [])
        
        # Check if any group members are waiting for approval from the current user
        waiting_for_approve = user_preferences.get('waiting_for_group_approve', [])
        
        # Add status information to group members
        for member in group_members:
            member_email = member.get('email')
            # Check if this member is waiting for approval from current user
            is_waiting = any(req.get('email') == member_email for req in waiting_for_approve)
            member['status'] = 'waiting_for_approval' if is_waiting else 'approved'
        
        print(f"🔍 USER GROUP DEBUG: User preferences: {user_preferences}")
        print(f"🔍 USER GROUP DEBUG: Found {len(group_members)} group members")
        print(f"🔍 USER GROUP DEBUG: Group members data: {group_members}")
        
        return jsonify({
            'success': True,
            'data': group_members
        }), 200
        
    except Exception as e:
        print(f"❌ USER GROUP ERROR: {e}")
        import traceback
        print(f"❌ USER GROUP ERROR Traceback: {traceback.format_exc()}")
        return jsonify({
            'success': False,
            'message': 'Failed to get group members'
        }), 500

@user_group_bp.route('/user-group', methods=['POST'])
@jwt_required()
def add_user_to_group():
    """Add a user to the current user's group"""
    try:
        current_user_id = get_jwt_identity()
        print(f"🔍 ADD USER DEBUG: Current user ID: {current_user_id}")
        
        data = request.get_json()
        print(f"🔍 ADD USER DEBUG: Request data: {data}")
        
        if not data or 'email' not in data:
            return jsonify({
                'success': False,
                'message': 'Email is required'
            }), 400
        
        email = data['email'].strip().lower()
        name = data.get('name', '').strip()
        print(f"🔍 ADD USER DEBUG: Email to add: {email}, Name: {name}")
        
        # Validate email format
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            return jsonify({
                'success': False,
                'message': 'Invalid email format'
            }), 400
        
        # Get current user
        current_user = User.query.get(current_user_id)
        if not current_user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        # Check if user is trying to add themselves
        if current_user.email.lower() == email:
            return jsonify({
                'success': False,
                'message': 'Cannot add yourself to your group'
            }), 400
        
        # Check if target user exists in the system
        target_user = User.query.filter_by(email=email).first()
        
        if target_user:
            # User exists - send invitation request
            target_preferences = target_user.user_preferences or {}
            waiting_for_approve = target_preferences.get('waiting_for_group_approve', [])
            
            # Check if already waiting for approval
            if any(req.get('email') == current_user.email for req in waiting_for_approve):
                return jsonify({
                    'success': False,
                    'message': 'Invitation already sent to this user'
                }), 400
            
            # Add invitation request to target user
            invitation_request = {
                'id': f"{current_user_id}_{email}_{len(waiting_for_approve)}",
                'email': current_user.email,
                'name': current_user.full_name or current_user.email,
                'requested_at': datetime.utcnow().isoformat(),
                'status': 'pending'
            }
            
            waiting_for_approve.append(invitation_request)
            target_preferences['waiting_for_group_approve'] = waiting_for_approve
            
            # Update target user preferences
            target_user.user_preferences = target_preferences
            from sqlalchemy.orm.attributes import flag_modified
            flag_modified(target_user, 'user_preferences')
            db.session.commit()
            
            print(f"✅ INVITATION SENT: Sent invitation to {email}")
            return jsonify({
                'success': True,
                'data': invitation_request,
                'message': f'Invitation sent to {email}. They will need to approve it.'
            }), 201
        else:
            # User doesn't exist - add directly to group (no approval needed)
            user_preferences = current_user.user_preferences or {}
            group_members = user_preferences.get('group_members', [])
            
            # Check if user already exists in group
            if any(member.get('email') == email for member in group_members):
                return jsonify({
                    'success': False,
                    'message': 'User already in your group'
                }), 400
            
            # Create new group member object
            new_member = {
                'id': f"{current_user_id}_{email}_{len(group_members)}",
                'email': email,
                'full_name': name or email,
                'added_at': datetime.utcnow().isoformat(),
                'status': 'approved'
            }
            
            # Add to group members
            group_members.append(new_member)
            user_preferences['group_members'] = group_members
            
            # Update user preferences
            current_user.user_preferences = user_preferences
            from sqlalchemy.orm.attributes import flag_modified
            flag_modified(current_user, 'user_preferences')
            db.session.commit()
            
            print(f"✅ ADD USER DEBUG: Successfully added user {email}")
            print(f"✅ ADD USER DEBUG: New member data: {new_member}")
            return jsonify({
                'success': True,
                'data': new_member,
                'message': 'User added to group successfully'
            }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ ADD USER ERROR: {e}")
        import traceback
        print(f"❌ ADD USER ERROR Traceback: {traceback.format_exc()}")
        return jsonify({
            'success': False,
            'message': 'Failed to add user to group'
        }), 500

@user_group_bp.route('/user-group/<string:member_id>', methods=['DELETE'])
@jwt_required()
def remove_user_from_group(member_id):
    """Remove a user from the current user's group"""
    try:
        current_user_id = get_jwt_identity()
        print(f"🔍 REMOVE USER DEBUG: Current user ID: {current_user_id}, Member ID: {member_id}")
        
        # Get current user
        current_user = User.query.get(current_user_id)
        if not current_user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        # Get current user preferences
        user_preferences = current_user.user_preferences or {}
        group_members = user_preferences.get('group_members', [])
        
        # Find and remove the member
        original_length = len(group_members)
        group_members = [member for member in group_members if member.get('id') != member_id]
        
        if len(group_members) == original_length:
            return jsonify({
                'success': False,
                'message': 'Group member not found'
            }), 404
        
        # Update user preferences
        user_preferences['group_members'] = group_members
        current_user.user_preferences = user_preferences
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(current_user, 'user_preferences')
        db.session.commit()
        
        print(f"✅ REMOVE USER DEBUG: Successfully removed user {member_id}")
        return jsonify({
            'success': True,
            'message': 'User removed from group successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ REMOVE USER ERROR: {e}")
        import traceback
        print(f"❌ REMOVE USER ERROR Traceback: {traceback.format_exc()}")
        return jsonify({
            'success': False,
            'message': 'Failed to remove user from group'
        }), 500

@user_group_bp.route('/user-group/pending-invitations', methods=['GET'])
@jwt_required()
def get_pending_invitations():
    """Get pending group invitations for the current user"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        if not current_user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        user_preferences = current_user.user_preferences or {}
        pending_invitations = user_preferences.get('waiting_for_group_approve', [])
        
        print(f"🔍 PENDING INVITATIONS DEBUG: Found {len(pending_invitations)} pending invitations")
        
        return jsonify({
            'success': True,
            'data': pending_invitations
        }), 200
        
    except Exception as e:
        print(f"❌ PENDING INVITATIONS ERROR: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to get pending invitations'
        }), 500

@user_group_bp.route('/user-group/approve-invitation', methods=['POST'])
@jwt_required()
def approve_invitation():
    """Approve a group invitation"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or 'invitation_id' not in data:
            return jsonify({
                'success': False,
                'message': 'Invitation ID is required'
            }), 400
        
        invitation_id = data['invitation_id']
        display_name = data.get('display_name', '').strip()
        
        current_user = User.query.get(current_user_id)
        if not current_user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        user_preferences = current_user.user_preferences or {}
        pending_invitations = user_preferences.get('waiting_for_group_approve', [])
        
        # Find the invitation
        invitation = next((inv for inv in pending_invitations if inv.get('id') == invitation_id), None)
        if not invitation:
            return jsonify({
                'success': False,
                'message': 'Invitation not found'
            }), 404
        
        # Add the inviter to current user's group
        group_members = user_preferences.get('group_members', [])
        new_member = {
            'id': f"{current_user_id}_{invitation['email']}_{len(group_members)}",
            'email': invitation['email'],
            'full_name': invitation['name'],
            'added_at': datetime.utcnow().isoformat(),
            'status': 'approved'
        }
        group_members.append(new_member)
        user_preferences['group_members'] = group_members
        
        # Add current user to inviter's group
        inviter = User.query.filter_by(email=invitation['email']).first()
        if inviter:
            inviter_preferences = inviter.user_preferences or {}
            inviter_group_members = inviter_preferences.get('group_members', [])
            inviter_new_member = {
                'id': f"{inviter.id}_{current_user.email}_{len(inviter_group_members)}",
                'email': current_user.email,
                'full_name': display_name or current_user.full_name or current_user.email,
                'added_at': datetime.utcnow().isoformat(),
                'status': 'approved'
            }
            inviter_group_members.append(inviter_new_member)
            inviter_preferences['group_members'] = inviter_group_members
            inviter.user_preferences = inviter_preferences
            from sqlalchemy.orm.attributes import flag_modified
            flag_modified(inviter, 'user_preferences')
        
        # Remove invitation from pending list
        user_preferences['waiting_for_group_approve'] = [
            inv for inv in pending_invitations if inv.get('id') != invitation_id
        ]
        current_user.user_preferences = user_preferences
        
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(current_user, 'user_preferences')
        db.session.commit()
        
        print(f"✅ INVITATION APPROVED: Approved invitation from {invitation['email']}")
        return jsonify({
            'success': True,
            'message': 'Invitation approved successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ APPROVE INVITATION ERROR: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to approve invitation'
        }), 500

@user_group_bp.route('/user-group/decline-invitation', methods=['POST'])
@jwt_required()
def decline_invitation():
    """Decline a group invitation"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or 'invitation_id' not in data:
            return jsonify({
                'success': False,
                'message': 'Invitation ID is required'
            }), 400
        
        invitation_id = data['invitation_id']
        
        current_user = User.query.get(current_user_id)
        if not current_user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        user_preferences = current_user.user_preferences or {}
        pending_invitations = user_preferences.get('waiting_for_group_approve', [])
        
        # Remove invitation from pending list
        user_preferences['waiting_for_group_approve'] = [
            inv for inv in pending_invitations if inv.get('id') != invitation_id
        ]
        current_user.user_preferences = user_preferences
        
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(current_user, 'user_preferences')
        db.session.commit()
        
        print(f"✅ INVITATION DECLINED: Declined invitation {invitation_id}")
        return jsonify({
            'success': True,
            'message': 'Invitation declined successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ DECLINE INVITATION ERROR: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to decline invitation'
        }), 500

@user_group_bp.route('/user-group/search', methods=['GET'])
@jwt_required()
def search_group_users():
    """Search for users in the current user's group"""
    try:
        current_user_id = get_jwt_identity()
        query = request.args.get('q', '').strip()
        
        if not query:
            return jsonify({
                'success': True,
                'data': []
            }), 200
        
        # Search group members by name or email
        group_members = UserGroup.query.filter_by(owner_id=current_user_id).filter(
            db.or_(
                UserGroup.member_name.ilike(f'%{query}%'),
                UserGroup.member_email.ilike(f'%{query}%')
            )
        ).all()
        
        return jsonify({
            'success': True,
            'data': [member.to_dict() for member in group_members]
        }), 200
        
    except Exception as e:
        print(f"Error searching group users: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to search group users'
        }), 500
