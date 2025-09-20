from database import db
from datetime import datetime
import uuid

class TelegramUser(db.Model):
    __tablename__ = 'telegram_users'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    telegram_id = db.Column(db.BigInteger, unique=True, nullable=False)
    telegram_username = db.Column(db.String(255))
    first_name = db.Column(db.String(255))
    user_id = db.Column(db.String(36), db.ForeignKey('profiles.id'), nullable=True)
    is_authenticated = db.Column(db.Boolean, default=False)
    authenticated_at = db.Column(db.DateTime)
    current_state = db.Column(db.String(100), default='idle')
    state_data = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    user = db.relationship('User', backref='telegram_accounts')
    
    def __repr__(self):
        return f'<TelegramUser {self.telegram_id}: {self.first_name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'telegram_id': self.telegram_id,
            'telegram_username': self.telegram_username,
            'first_name': self.first_name,
            'user_id': self.user_id,
            'is_authenticated': self.is_authenticated,
            'authenticated_at': self.authenticated_at.isoformat() if self.authenticated_at else None,
            'current_state': self.current_state,
            'state_data': self.state_data,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
