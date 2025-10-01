from database import db
from datetime import datetime
import uuid

class Task(db.Model):
    __tablename__ = 'tasks'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # New columns (may not exist in production yet)
    title = db.Column(db.String(255), nullable=True)  # Made nullable temporarily
    description = db.Column(db.Text, nullable=True)
    project = db.Column(db.String(100), nullable=True)  # Made nullable temporarily
    scheduled_date = db.Column(db.DateTime, nullable=True)
    is_scheduled = db.Column(db.Boolean, default=False, nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=True)
    
    # Existing columns
    status = db.Column(db.String(50), default='todo')  # 'todo', 'in_progress', 'completed', 'cancelled'
    priority = db.Column(db.String(50), default='medium')  # 'low', 'medium', 'high'
    due_date = db.Column(db.DateTime)  # When task should be completed
    owner_id = db.Column(db.String(36), db.ForeignKey('profiles.id'), nullable=False)
    created_by = db.Column(db.String(36), db.ForeignKey('profiles.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Legacy columns (for backward compatibility)
    text = db.Column(db.Text, nullable=False, default='')  # Old title field with default
    assign_to = db.Column(db.String(255), nullable=True)
    label = db.Column(db.String(100), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    alert_time = db.Column(db.DateTime, nullable=True)
    task_id = db.Column(db.String(255), nullable=True)
    
    # Relationships
    creator = db.relationship('User', foreign_keys=[created_by], backref='created_tasks')
    
    def __repr__(self):
        return f'<Task {self.id}: {self.title[:50]}...>'
    
    def to_dict(self):
        # Handle missing columns gracefully
        title = getattr(self, 'title', None) or getattr(self, 'text', 'Untitled Task')
        description = getattr(self, 'description', None) or getattr(self, 'notes', '')
        project = getattr(self, 'project', None) or 'personal'
        scheduled_date = getattr(self, 'scheduled_date', None)
        is_scheduled = getattr(self, 'is_scheduled', False)
        is_active = getattr(self, 'is_active', True)
        
        return {
            'id': self.id,
            'title': title,
            'description': description,
            'project': project,
            'status': self.status,
            'priority': self.priority,
            'scheduled_date': scheduled_date.isoformat() if scheduled_date else None,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'is_scheduled': is_scheduled,
            'is_active': is_active,
            'owner_id': self.owner_id,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
