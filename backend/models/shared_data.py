from database import db
from datetime import datetime
import uuid

class SharedData(db.Model):
    __tablename__ = 'shared_data'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_id = db.Column(db.String(36), db.ForeignKey('profiles.id'), nullable=False)
    shared_with_user_id = db.Column(db.String(36), db.ForeignKey('profiles.id'), nullable=False)
    table_name = db.Column(db.String(100), nullable=False)
    record_id = db.Column(db.String(36), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Unique constraint
    __table_args__ = (db.UniqueConstraint('owner_id', 'shared_with_user_id', 'table_name', 'record_id'),)
    
    def __repr__(self):
        return f'<SharedData {self.table_name}:{self.record_id}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'owner_id': self.owner_id,
            'shared_with_user_id': self.shared_with_user_id,
            'table_name': self.table_name,
            'record_id': self.record_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
