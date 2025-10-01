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
    whatsapp_phone_number = db.Column(db.String(20), unique=True, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    people = db.relationship('Person', foreign_keys='Person.owner_id', backref='owner', lazy='dynamic')
    tasks = db.relationship('Task', foreign_keys='Task.owner_id', backref='owner', lazy='dynamic')
    events = db.relationship('Event', foreign_keys='Event.user_id', backref='user', lazy='dynamic')
    
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
            'whatsapp_phone_number': self.whatsapp_phone_number,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }