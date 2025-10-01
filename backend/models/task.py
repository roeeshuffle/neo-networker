from database import db
from datetime import datetime
import uuid

class Task(db.Model):
    __tablename__ = 'tasks'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    project = db.Column(db.String(100), nullable=False)  # 'personal', 'company', 'project_name', etc.
    status = db.Column(db.String(50), default='todo')  # 'todo', 'in_progress', 'completed', 'cancelled'
    priority = db.Column(db.String(50), default='medium')  # 'low', 'medium', 'high'
    scheduled_date = db.Column(db.DateTime)  # When task should appear (for future tasks)
    due_date = db.Column(db.DateTime)  # When task should be completed
    is_scheduled = db.Column(db.Boolean, default=False)  # True if task is scheduled for future
    is_active = db.Column(db.Boolean, default=True)  # False if task is disabled (future scheduled)
    owner_id = db.Column(db.String(36), db.ForeignKey('profiles.id'), nullable=False)
    created_by = db.Column(db.String(36), db.ForeignKey('profiles.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    creator = db.relationship('User', foreign_keys=[created_by], backref='created_tasks')
    
    def __repr__(self):
        return f'<Task {self.id}: {self.title[:50]}...>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'project': self.project,
            'status': self.status,
            'priority': self.priority,
            'scheduled_date': self.scheduled_date.isoformat() if self.scheduled_date else None,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'is_scheduled': self.is_scheduled,
            'is_active': self.is_active,
            'owner_id': self.owner_id,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
