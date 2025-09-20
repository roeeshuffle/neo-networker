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
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
