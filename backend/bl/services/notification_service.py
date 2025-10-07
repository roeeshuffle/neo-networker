from dal.database import db
from dal.models import Notification
from datetime import datetime

def create_notification(user_email: str, message: str):
    """Create a notification for a user"""
    try:
        notification = Notification(
            user_email=user_email,
            notification=message,
            is_read=False
        )
        db.session.add(notification)
        db.session.commit()
        print(f"📢 Notification created for {user_email}: {message}")
    except Exception as e:
        print(f"❌ Error creating notification: {e}")
        db.session.rollback()

def notify_contact_shared(shared_by_email: str, shared_with_email: str, contact_name: str):
    """Create notification when contacts are shared"""
    message = f"{shared_by_email} shared contact '{contact_name}' with you"
    create_notification(shared_with_email, message)

def notify_task_assigned(assigned_by_email: str, assigned_to_email: str, task_title: str):
    """Create notification when a task is assigned"""
    message = f"{assigned_by_email} assigned task '{task_title}' to you"
    create_notification(assigned_to_email, message)

def notify_task_created_in_project(created_by_email: str, project_name: str, task_title: str, project_participants: list):
    """Create notification when a task is created in a project"""
    message = f"{created_by_email} created task '{task_title}' in project '{project_name}'"
    for participant_email in project_participants:
        if participant_email != created_by_email:  # Don't notify the creator
            create_notification(participant_email, message)

def notify_group_invitation(inviter_email: str, invitee_email: str):
    """Create notification when someone is added to a group and waiting for approval"""
    message = f"{inviter_email} added you to their group and is waiting for your approval"
    create_notification(invitee_email, message)

def notify_event_participant(created_by_email: str, event_title: str, participant_email: str):
    """Create notification when an event is created with user as participant"""
    message = f"{created_by_email} created event '{event_title}' and added you as a participant"
    create_notification(participant_email, message)
