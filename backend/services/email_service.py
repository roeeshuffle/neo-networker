import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.smtp_username = os.getenv('SMTP_USERNAME', '')
        self.smtp_password = os.getenv('SMTP_PASSWORD', '')
        self.from_email = os.getenv('FROM_EMAIL', 'noreply@neo-networker.com')
    
    def send_approval_notification(self, user_email, user_name):
        """Send email notification when user is approved"""
        try:
            subject = "Your Neo Networker Account Has Been Approved!"
            
            body = f"""
            Hello {user_name},
            
            Great news! Your Neo Networker account has been approved by an administrator.
            
            You can now log in to your account and start using all the features:
            - Manage your contacts
            - Create and track tasks
            - Connect your Telegram bot
            - Upload CSV files
            - Share data with other users
            
            Login at: https://d2fq8k5py78ii.cloudfront.net/
            
            Best regards,
            The Neo Networker Team
            """
            
            return self._send_email(user_email, subject, body)
            
        except Exception as e:
            print(f"Error sending approval email: {e}")
            return False
    
    def send_rejection_notification(self, user_email, user_name):
        """Send email notification when user is rejected"""
        try:
            subject = "Neo Networker Account Status Update"
            
            body = f"""
            Hello {user_name},
            
            We're sorry to inform you that your Neo Networker account request has not been approved at this time.
            
            If you believe this is an error, please contact our support team.
            
            Best regards,
            The Neo Networker Team
            """
            
            return self._send_email(user_email, subject, body)
            
        except Exception as e:
            print(f"Error sending rejection email: {e}")
            return False
    
    def _send_email(self, to_email, subject, body):
        """Send email using SMTP"""
        try:
            if not self.smtp_username or not self.smtp_password:
                print("SMTP credentials not configured. Email not sent.")
                return False
            
            msg = MIMEMultipart()
            msg['From'] = self.from_email
            msg['To'] = to_email
            msg['Subject'] = subject
            
            msg.attach(MIMEText(body, 'plain'))
            
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.smtp_username, self.smtp_password)
            
            text = msg.as_string()
            server.sendmail(self.from_email, to_email, text)
            server.quit()
            
            print(f"Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            print(f"Error sending email: {e}")
            return False

# Global email service instance
email_service = EmailService()
