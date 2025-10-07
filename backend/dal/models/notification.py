from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from ..database import db
from datetime import datetime

class Notification(db.Model):
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True, index=True)
    user_email = db.Column(db.String(255), nullable=False, index=True)
    notification = db.Column(db.Text, nullable=False)
    notification_type = db.Column(db.String(50), nullable=False)  # 'event_assigned', 'task_assigned', 'contact_shared'
    is_read = db.Column(db.Boolean, default=False)
    seen = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_email': self.user_email,
            'notification': self.notification,
            'notification_type': self.notification_type,
            'is_read': self.is_read,
            'seen': self.seen,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
