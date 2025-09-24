from database import db
from datetime import datetime
import uuid

class User(db.Model):
    __tablename__ = 'profiles'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=True)
    full_name = db.Column(db.String(255))
    is_approved = db.Column(db.Boolean, default=False)
    approved_by = db.Column(db.String(36), db.ForeignKey('profiles.id'))
    approved_at = db.Column(db.DateTime)
    avatar_url = db.Column(db.Text)
    provider = db.Column(db.String(50), default='email')
    telegram_id = db.Column(db.BigInteger, unique=True, nullable=True)
    whatsapp_phone = db.Column(db.String(20), unique=True, nullable=True)
    preferred_messaging_platform = db.Column(db.String(20), default='telegram')  # 'telegram' or 'whatsapp'
    state_data = db.Column(db.JSON, nullable=True)  # For storing temporary state like voice transcriptions
    
    # Google OAuth fields
    google_id = db.Column(db.String(100), unique=True, nullable=True)
    google_refresh_token = db.Column(db.Text, nullable=True)
    google_access_token = db.Column(db.Text, nullable=True)
    google_token_expires_at = db.Column(db.DateTime, nullable=True)
    google_contacts_synced_at = db.Column(db.DateTime, nullable=True)
    google_calendar_synced_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    approved_by_user = db.relationship('User', remote_side=[id], backref='approved_users')
    people = db.relationship('Person', foreign_keys='Person.owner_id', backref='owner', lazy='dynamic')
    companies = db.relationship('Company', foreign_keys='Company.owner_id', backref='owner', lazy='dynamic')
    tasks = db.relationship('Task', foreign_keys='Task.owner_id', backref='owner', lazy='dynamic')
    shared_data_owned = db.relationship('SharedData', foreign_keys='SharedData.owner_id', backref='owner', lazy='dynamic')
    shared_data_shared_with = db.relationship('SharedData', foreign_keys='SharedData.shared_with_user_id', backref='shared_with_user', lazy='dynamic')
    
    def __repr__(self):
        return f'<User {self.email}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'full_name': self.full_name,
            'is_approved': self.is_approved,
            'approved_by': self.approved_by,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'avatar_url': self.avatar_url,
            'provider': self.provider,
            'telegram_id': self.telegram_id,
            'whatsapp_phone': self.whatsapp_phone,
            'preferred_messaging_platform': self.preferred_messaging_platform,
            'state_data': self.state_data,
            'google_id': self.google_id,
            'google_contacts_synced_at': self.google_contacts_synced_at.isoformat() if self.google_contacts_synced_at else None,
            'google_calendar_synced_at': self.google_calendar_synced_at.isoformat() if self.google_calendar_synced_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
