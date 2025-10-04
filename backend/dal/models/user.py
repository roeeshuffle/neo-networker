from ..database import db
from datetime import datetime
import uuid

class User(db.Model):
    __tablename__ = 'profiles'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=True)
    is_approved = db.Column(db.Boolean, default=False)
    telegram_id = db.Column(db.BigInteger, unique=True, nullable=True)
    # whatsapp_phone_number = db.Column(db.String(20), unique=True, nullable=True)  # Temporarily disabled - column doesn't exist in DB
    telegram_username = db.Column(db.String(255), nullable=True)
    
    # Additional fields from the database
    approved_by = db.Column(db.String(36), db.ForeignKey('profiles.id'), nullable=True)
    approved_at = db.Column(db.DateTime, nullable=True)
    avatar_url = db.Column(db.Text, nullable=True)
    provider = db.Column(db.String(50), nullable=True)
    preferred_messaging_platform = db.Column(db.String(20), default='telegram')
    state_data = db.Column(db.JSON, nullable=True)
    user_preferences = db.Column(db.JSON, nullable=True)
    google_id = db.Column(db.String(100), unique=True, nullable=True)
    google_refresh_token = db.Column(db.Text, nullable=True)
    google_access_token = db.Column(db.Text, nullable=True)
    google_token_expires_at = db.Column(db.DateTime, nullable=True)
    google_contacts_synced_at = db.Column(db.DateTime, nullable=True)
    google_calendar_synced_at = db.Column(db.DateTime, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    people = db.relationship('Person', foreign_keys='Person.owner_id', backref='owner', lazy='dynamic')
    tasks = db.relationship('Task', foreign_keys='Task.owner_id', backref='owner', lazy='dynamic')
    # events relationship temporarily removed due to SQLAlchemy conflict
    
    def __repr__(self):
        return f'<User {self.email}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'full_name': self.full_name,
            'email': self.email,
            'password_hash': self.password_hash,
            'is_approved': self.is_approved,
            'telegram_id': self.telegram_id,
            # 'whatsapp_phone_number': self.whatsapp_phone_number,  # Temporarily disabled
            'telegram_username': self.telegram_username,
            'approved_by': self.approved_by,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'avatar_url': self.avatar_url,
            'provider': self.provider,
            'preferred_messaging_platform': self.preferred_messaging_platform,
            'state_data': self.state_data,
            'user_preferences': self.user_preferences,
            'google_id': self.google_id,
            'google_refresh_token': self.google_refresh_token,
            'google_access_token': self.google_access_token,
            'google_token_expires_at': self.google_token_expires_at.isoformat() if self.google_token_expires_at else None,
            'google_contacts_synced_at': self.google_contacts_synced_at.isoformat() if self.google_contacts_synced_at else None,
            'google_calendar_synced_at': self.google_calendar_synced_at.isoformat() if self.google_calendar_synced_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }