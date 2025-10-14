import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from typing import List, Optional
import os

logger = logging.getLogger('email_service')

class EmailService:
    """Email service for sending emails via Google Workspace SMTP"""
    
    def __init__(self):
        self.smtp_host = "smtp.gmail.com"
        self.smtp_port = 587
        self.sender_email = "alerts@weralist.com"
        self.sender_password = os.getenv('GOOGLE_WORKSPACE_APP_PASSWORD')
        
        if not self.sender_password:
            logger.warning("GOOGLE_WORKSPACE_APP_PASSWORD not set. Email sending will be disabled.")
    
    def send_email(self, 
                   to_emails: List[str], 
                   subject: str, 
                   body: str, 
                   html_body: Optional[str] = None,
                   cc_emails: Optional[List[str]] = None,
                   bcc_emails: Optional[List[str]] = None) -> bool:
        """
        Send email to recipients
        
        Args:
            to_emails: List of recipient email addresses
            subject: Email subject
            body: Plain text email body
            html_body: HTML email body (optional)
            cc_emails: CC recipients (optional)
            bcc_emails: BCC recipients (optional)
        
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        if not self.sender_password:
            logger.error("Cannot send email: GOOGLE_WORKSPACE_APP_PASSWORD not configured")
            return False
        
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['From'] = self.sender_email
            msg['To'] = ', '.join(to_emails)
            msg['Subject'] = subject
            
            if cc_emails:
                msg['Cc'] = ', '.join(cc_emails)
            
            # Add plain text part
            text_part = MIMEText(body, 'plain')
            msg.attach(text_part)
            
            # Add HTML part if provided
            if html_body:
                html_part = MIMEText(html_body, 'html')
                msg.attach(html_part)
            
            # Connect to SMTP server
            server = smtplib.SMTP(self.smtp_host, self.smtp_port)
            server.starttls()  # Enable TLS encryption
            server.login(self.sender_email, self.sender_password)
            
            # Send email
            all_recipients = to_emails.copy()
            if cc_emails:
                all_recipients.extend(cc_emails)
            if bcc_emails:
                all_recipients.extend(bcc_emails)
            
            server.send_message(msg, to_addrs=all_recipients)
            server.quit()
            
            logger.info(f"Email sent successfully to {len(all_recipients)} recipients")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")
            return False
    
    def send_notification_email(self, user_email: str, notification_type: str, message: str) -> bool:
        """
        Send notification email to user
        
        Args:
            user_email: User's email address
            notification_type: Type of notification (task_assigned, contact_shared, etc.)
            message: Notification message
        
        Returns:
            bool: True if email sent successfully
        """
        subject_map = {
            'task_assigned': 'New Task Assigned - Weralist',
            'contact_shared': 'Contacts Shared - Weralist',
            'event_created': 'New Event Created - Weralist',
            'group_invitation': 'Group Invitation - Weralist',
            'general': 'Notification - Weralist'
        }
        
        subject = subject_map.get(notification_type, subject_map['general'])
        
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h2 style="color: #2c3e50; margin-top: 0;">Weralist Notification</h2>
                    <p style="margin: 0; font-size: 16px;">{message}</p>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                    <a href="https://weralist.com" 
                       style="background-color: #3498db; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                        Open Weralist
                    </a>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; 
                            font-size: 12px; color: #666; text-align: center;">
                    <p>This email was sent from Weralist. If you don't want to receive these emails, 
                    please contact support@weralist.com</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        plain_body = f"""
Weralist Notification

{message}

Visit Weralist: https://weralist.com

---
This email was sent from Weralist. If you don't want to receive these emails, 
please contact support@weralist.com
        """
        
        return self.send_email(
            to_emails=[user_email],
            subject=subject,
            body=plain_body,
            html_body=html_body
        )
    
    def send_bulk_email(self, user_emails: List[str], subject: str, message: str) -> bool:
        """
        Send bulk email to multiple users
        
        Args:
            user_emails: List of user email addresses
            subject: Email subject
            message: Email message
        
        Returns:
            bool: True if emails sent successfully
        """
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h2 style="color: #2c3e50; margin-top: 0;">Weralist Update</h2>
                    <p style="margin: 0; font-size: 16px;">{message}</p>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                    <a href="https://weralist.com" 
                       style="background-color: #3498db; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                        Open Weralist
                    </a>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; 
                            font-size: 12px; color: #666; text-align: center;">
                    <p>This email was sent from Weralist. If you don't want to receive these emails, 
                    please contact support@weralist.com</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        plain_body = f"""
Weralist Update

{message}

Visit Weralist: https://weralist.com

---
This email was sent from Weralist. If you don't want to receive these emails, 
please contact support@weralist.com
        """
        
        return self.send_email(
            to_emails=user_emails,
            subject=subject,
            body=plain_body,
            html_body=html_body
        )

# Global instance
email_service = EmailService()