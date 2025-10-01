from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from ..database import db
from datetime import datetime
import json

class Event(db.Model):
    __tablename__ = 'events'
    
    id = db.Column(db.Integer, primary_key=True, index=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    start_datetime = db.Column(db.DateTime, nullable=False)
    end_datetime = db.Column(db.DateTime, nullable=False)
    location = db.Column(db.String(255))
    event_type = db.Column(db.String(50), default='event')  # 'meeting' or 'event'
    participants = db.Column(db.JSON)  # List of participant objects with name, email, etc.
    alert_minutes = db.Column(db.Integer, default=15)  # Minutes before event to alert
    repeat_pattern = db.Column(db.String(50))  # 'daily', 'weekly', 'monthly', 'yearly', 'none'
    repeat_interval = db.Column(db.Integer, default=1)  # Every X days/weeks/months/years
    repeat_days = db.Column(db.JSON)  # For weekly: [0,1,2,3,4,5,6] (Monday=0)
    repeat_end_date = db.Column(db.DateTime)  # When to stop repeating
    notes = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign key to user
    user_id = db.Column(db.String(36), db.ForeignKey('profiles.id'), nullable=False)
    user = db.relationship("User", foreign_keys=[user_id], backref="events")
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'start_datetime': self.start_datetime.isoformat() if self.start_datetime else None,
            'end_datetime': self.end_datetime.isoformat() if self.end_datetime else None,
            'location': self.location,
            'event_type': self.event_type,
            'participants': self.participants or [],
            'alert_minutes': self.alert_minutes,
            'repeat_pattern': self.repeat_pattern,
            'repeat_interval': self.repeat_interval,
            'repeat_days': self.repeat_days or [],
            'repeat_end_date': self.repeat_end_date.isoformat() if self.repeat_end_date else None,
            'notes': self.notes,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'user_id': self.user_id
        }
