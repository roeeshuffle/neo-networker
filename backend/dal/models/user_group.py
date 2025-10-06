from ..database import db
from datetime import datetime

class UserGroup(db.Model):
    __tablename__ = 'user_groups'
    
    id = db.Column(db.Integer, primary_key=True, index=True)
    owner_id = db.Column(db.String(36), db.ForeignKey('profiles.id'), nullable=False)
    member_email = db.Column(db.String(255), nullable=False)
    member_name = db.Column(db.String(255), nullable=True)
    added_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Ensure unique owner-member combinations
    __table_args__ = (
        db.UniqueConstraint('owner_id', 'member_email', name='unique_owner_member'),
    )
    
    def __repr__(self):
        return f'<UserGroup {self.owner_id} -> {self.member_email}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.member_email,
            'full_name': self.member_name,
            'added_at': self.added_at.isoformat() if self.added_at else None
        }
