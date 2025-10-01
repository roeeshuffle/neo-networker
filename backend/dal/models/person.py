from ..database import db
from datetime import datetime
import uuid

class Person(db.Model):
    __tablename__ = 'people'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name = db.Column(db.String(255), nullable=False)
    company = db.Column(db.String(255))
    categories = db.Column(db.Text)
    email = db.Column(db.String(255))
    newsletter = db.Column(db.Boolean, default=False)
    status = db.Column(db.String(100))
    linkedin_profile = db.Column(db.Text)
    poc_in_apex = db.Column(db.String(255))
    who_warm_intro = db.Column(db.String(255))
    agenda = db.Column(db.Text)
    meeting_notes = db.Column(db.Text)
    should_avishag_meet = db.Column(db.Boolean, default=False)
    more_info = db.Column(db.Text)
    job_title = db.Column(db.String(255))
    tags = db.Column(db.Text)
    zog = db.Column(db.String(255))
    intel_144 = db.Column(db.String(255))
    connection_strength = db.Column(db.String(255))
    last_email_interaction = db.Column(db.DateTime)
    country = db.Column(db.String(255))
    next_due_task = db.Column(db.DateTime)
    owner_id = db.Column(db.String(36), db.ForeignKey('profiles.id'), nullable=False)
    created_by = db.Column(db.String(36), db.ForeignKey('profiles.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    creator = db.relationship('User', foreign_keys=[created_by], backref='created_people')
    
    def __repr__(self):
        return f'<Person {self.full_name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'full_name': self.full_name,
            'company': self.company,
            'categories': self.categories,
            'email': self.email,
            'newsletter': self.newsletter,
            'status': self.status,
            'linkedin_profile': self.linkedin_profile,
            'poc_in_apex': self.poc_in_apex,
            'who_warm_intro': self.who_warm_intro,
            'agenda': self.agenda,
            'meeting_notes': self.meeting_notes,
            'should_avishag_meet': self.should_avishag_meet,
            'more_info': self.more_info,
            'job_title': self.job_title,
            'tags': self.tags,
            'zog': self.zog,
            'intel_144': self.intel_144,
            'connection_strength': self.connection_strength,
            'last_email_interaction': self.last_email_interaction.isoformat() if self.last_email_interaction else None,
            'country': self.country,
            'next_due_task': self.next_due_task.isoformat() if self.next_due_task else None,
            'owner_id': self.owner_id,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
