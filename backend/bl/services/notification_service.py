import os
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any
from dal.models import Event, Task, User, Notification
from dal.database import db
from bl.services.email_service import email_service
import json

logger = logging.getLogger('notification_service')

class NotificationService:
    """Service for handling email notifications"""
    
    def __init__(self):
        self.email_service = email_service
    
    def send_event_reminder(self, event: Event) -> bool:
        """Send event reminder email to owner and participants"""
        try:
            # Get event owner
            owner = User.query.get(event.owner_id)
            if not owner:
                logger.error(f"Event owner not found: {event.owner_id}")
                return False
            
            # Prepare recipient emails
            recipients = [owner.email]
            
            # Add participants
            if event.participants:
                try:
                    participants_data = event.participants if isinstance(event.participants, list) else json.loads(event.participants)
                    for participant in participants_data:
                        if isinstance(participant, dict) and 'email' in participant:
                            recipients.append(participant['email'])
                        elif isinstance(participant, str):
                            # If participant is just an email string
                            recipients.append(participant)
                except (json.JSONDecodeError, TypeError) as e:
                    logger.warning(f"Could not parse participants for event {event.id}: {e}")
            
            # Remove duplicates
            recipients = list(set(recipients))
            
            # Create email content
            subject = f"Event Reminder: {event.title}"
            
            # Format start time
            start_time = event.start_datetime.strftime("%A, %B %d, %Y at %I:%M %p")
            
            html_content = f"""
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }}
                    .container {{ max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); }}
                    .header {{ background-color: #4CAF50; color: white; padding: 15px 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                    .content {{ padding: 20px; line-height: 1.6; color: #333333; }}
                    .event-details {{ background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; }}
                    .footer {{ text-align: center; margin-top: 20px; font-size: 0.8em; color: #777777; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📅 Event Reminder</h1>
                    </div>
                    <div class="content">
                        <p>Hello,</p>
                        <p>This is a reminder that you have an upcoming event:</p>
                        
                        <div class="event-details">
                            <h3>{event.title}</h3>
                            <p><strong>When:</strong> {start_time}</p>
                            {f'<p><strong>Location:</strong> {event.location}</p>' if event.location else ''}
                            {f'<p><strong>Description:</strong> {event.description}</p>' if event.description else ''}
                            {f'<p><strong>Project:</strong> {event.project}</p>' if event.project else ''}
                        </div>
                        
                        <p>Don't forget to prepare for this event!</p>
                    </div>
                    <div class="footer">
                        <p>&copy; {datetime.now().year} Weralist. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            plain_text_content = f"""
            Event Reminder: {event.title}
            
            Hello,
            
            This is a reminder that you have an upcoming event:
            
            Event: {event.title}
            When: {start_time}
            {f'Location: {event.location}' if event.location else ''}
            {f'Description: {event.description}' if event.description else ''}
            {f'Project: {event.project}' if event.project else ''}
            
            Don't forget to prepare for this event!
            
            © {datetime.now().year} Weralist. All rights reserved.
            """
            
            # Send email to all recipients
            failed_recipients = self.email_service.send_bulk_email(
                recipient_emails=recipients,
                subject=subject,
                html_content=html_content,
                plain_text_content=plain_text_content
            )
            
            if failed_recipients:
                logger.warning(f"Failed to send event reminder to: {failed_recipients}")
            
            logger.info(f"Event reminder sent for event '{event.title}' to {len(recipients)} recipients")
            return True
            
        except Exception as e:
            logger.error(f"Error sending event reminder for event {event.id}: {e}")
            return False
    
    def send_task_assignment_notification(self, task: Task, assignee_email: str) -> bool:
        """Send email notification when a task is assigned to someone"""
        try:
            # Get task owner
            owner = User.query.get(task.owner_id)
            if not owner:
                logger.error(f"Task owner not found: {task.owner_id}")
                return False
            
            subject = f"New Task Assigned: {task.title}"
            
            html_content = f"""
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }}
                    .container {{ max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); }}
                    .header {{ background-color: #2196F3; color: white; padding: 15px 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                    .content {{ padding: 20px; line-height: 1.6; color: #333333; }}
                    .task-details {{ background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; }}
                    .footer {{ text-align: center; margin-top: 20px; font-size: 0.8em; color: #777777; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📋 Task Assignment</h1>
                    </div>
                    <div class="content">
                        <p>Hello,</p>
                        <p><strong>{owner.full_name or owner.email}</strong> has assigned you a new task:</p>
                        
                        <div class="task-details">
                            <h3>{task.title}</h3>
                            <p><strong>Project:</strong> {task.project or 'No project'}</p>
                            <p><strong>Priority:</strong> {task.priority or 'Medium'}</p>
                            <p><strong>Status:</strong> {task.status or 'To Do'}</p>
                            {f'<p><strong>Description:</strong> {task.description}</p>' if task.description else ''}
                            {f'<p><strong>Due Date:</strong> {task.due_date.strftime("%A, %B %d, %Y") if task.due_date else "No due date"}</p>' if task.due_date else ''}
                        </div>
                        
                        <p>Please check your Weralist dashboard to view and work on this task.</p>
                    </div>
                    <div class="footer">
                        <p>&copy; {datetime.now().year} Weralist. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            plain_text_content = f"""
            Task Assignment: {task.title}
            
            Hello,
            
            {owner.full_name or owner.email} has assigned you a new task:
            
            Task: {task.title}
            Project: {task.project or 'No project'}
            Priority: {task.priority or 'Medium'}
            Status: {task.status or 'To Do'}
            {f'Description: {task.description}' if task.description else ''}
            {f'Due Date: {task.due_date.strftime("%A, %B %d, %Y") if task.due_date else "No due date"}' if task.due_date else ''}
            
            Please check your Weralist dashboard to view and work on this task.
            
            © {datetime.now().year} Weralist. All rights reserved.
            """
            
            success = self.email_service.send_notification_email(
                user_email=assignee_email,
                notification_type='task_assignment',
                message=f"New task assigned: {task.title}"
            )
            
            if success:
                logger.info(f"Task assignment notification sent to {assignee_email} for task '{task.title}'")
            else:
                logger.error(f"Failed to send task assignment notification to {assignee_email}")
            
            return success
            
        except Exception as e:
            logger.error(f"Error sending task assignment notification: {e}")
            return False
    
    def send_group_invitation_notification(self, group_name: str, inviter_email: str, invitee_email: str) -> bool:
        """Send email notification when someone adds you to their group"""
        try:
            # Get inviter details
            inviter = User.query.filter_by(email=inviter_email).first()
            inviter_name = inviter.full_name if inviter and inviter.full_name else inviter_email
            
            subject = f"You've been added to group: {group_name}"
            
            html_content = f"""
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }}
                    .container {{ max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); }}
                    .header {{ background-color: #FF9800; color: white; padding: 15px 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                    .content {{ padding: 20px; line-height: 1.6; color: #333333; }}
                    .group-details {{ background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; }}
                    .footer {{ text-align: center; margin-top: 20px; font-size: 0.8em; color: #777777; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>👥 Group Invitation</h1>
                    </div>
                    <div class="content">
                        <p>Hello,</p>
                        <p><strong>{inviter_name}</strong> has added you to their group:</p>
                        
                        <div class="group-details">
                            <h3>{group_name}</h3>
                            <p>You can now collaborate on tasks and events within this group.</p>
                        </div>
                        
                        <p>Please check your Weralist dashboard to see the group and start collaborating!</p>
                    </div>
                    <div class="footer">
                        <p>&copy; {datetime.now().year} Weralist. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            plain_text_content = f"""
            Group Invitation: {group_name}
            
            Hello,
            
            {inviter_name} has added you to their group:
            
            Group: {group_name}
            
            You can now collaborate on tasks and events within this group.
            
            Please check your Weralist dashboard to see the group and start collaborating!
            
            © {datetime.now().year} Weralist. All rights reserved.
            """
            
            success = self.email_service.send_notification_email(
                user_email=invitee_email,
                notification_type='group_invitation',
                message=f"Added to group: {group_name}"
            )
            
            if success:
                logger.info(f"Group invitation notification sent to {invitee_email} for group '{group_name}'")
            else:
                logger.error(f"Failed to send group invitation notification to {invitee_email}")
            
            return success
            
        except Exception as e:
            logger.error(f"Error sending group invitation notification: {e}")
            return False
    
    def check_and_send_event_reminders(self) -> int:
        """Check for events that need reminders and send them"""
        try:
            now = datetime.utcnow()
            reminders_sent = 0
            
            # Find events that need reminders
            # We'll check events that start within the next 24 hours and haven't had reminders sent
            upcoming_events = Event.query.filter(
                Event.start_datetime > now,
                Event.start_datetime <= now + timedelta(hours=24),
                Event.is_active == True
            ).all()
            
            for event in upcoming_events:
                # Calculate when reminder should be sent
                reminder_time = event.start_datetime - timedelta(minutes=event.alert_minutes)
                
                # Check if it's time to send the reminder (within 5 minutes of reminder time)
                if now >= reminder_time - timedelta(minutes=5) and now <= reminder_time + timedelta(minutes=5):
                    # Check if we already sent a reminder for this event
                    existing_notification = Notification.query.filter_by(
                        user_email=event.owner_id,  # Using owner_id as user_email for now
                        notification_type='event_reminder',
                        notification=f"Event reminder: {event.title}"
                    ).first()
                    
                    if not existing_notification:
                        # Send reminder
                        if self.send_event_reminder(event):
                            # Create notification record
                            notification = Notification(
                                user_email=event.owner_id,
                                notification=f"Event reminder sent: {event.title}",
                                notification_type='event_reminder',
                                is_read=False,
                                seen=False
                            )
                            db.session.add(notification)
                            reminders_sent += 1
            
            db.session.commit()
            logger.info(f"Sent {reminders_sent} event reminders")
            return reminders_sent
            
        except Exception as e:
            logger.error(f"Error checking event reminders: {e}")
            db.session.rollback()
            return 0

# Create global instance
notification_service = NotificationService()