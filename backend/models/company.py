from database import db
from datetime import datetime
import uuid

class Company(db.Model):
    __tablename__ = 'companies'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    record = db.Column(db.Text, nullable=False)  # Company name/record
    tags = db.Column(db.ARRAY(db.String))
    categories = db.Column(db.Text)
    linkedin_profile = db.Column(db.Text)
    last_interaction = db.Column(db.DateTime)
    connection_strength = db.Column(db.String(100))
    twitter_follower_count = db.Column(db.Integer)
    twitter = db.Column(db.String(255))
    domains = db.Column(db.ARRAY(db.String))
    description = db.Column(db.Text)
    notion_id = db.Column(db.String(255))
    owner_id = db.Column(db.String(36), db.ForeignKey('profiles.id'), nullable=False)
    created_by = db.Column(db.String(36), db.ForeignKey('profiles.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    creator = db.relationship('User', foreign_keys=[created_by], backref='created_companies')
    
    def __repr__(self):
        return f'<Company {self.record}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'record': self.record,
            'tags': self.tags,
            'categories': self.categories,
            'linkedin_profile': self.linkedin_profile,
            'last_interaction': self.last_interaction.isoformat() if self.last_interaction else None,
            'connection_strength': self.connection_strength,
            'twitter_follower_count': self.twitter_follower_count,
            'twitter': self.twitter,
            'domains': self.domains,
            'description': self.description,
            'notion_id': self.notion_id,
            'owner_id': self.owner_id,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
