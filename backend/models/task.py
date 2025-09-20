from database import db
from datetime import datetime
import uuid

class Task(db.Model):
    __tablename__ = 'tasks'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    task_id = db.Column(db.Integer, nullable=True)
    text = db.Column(db.Text, nullable=False)
    assign_to = db.Column(db.String(255))
    due_date = db.Column(db.DateTime)
    status = db.Column(db.String(50), default='todo')
    label = db.Column(db.String(100))
    priority = db.Column(db.String(50), default='medium')
    notes = db.Column(db.Text)
    alert_time = db.Column(db.DateTime)
    owner_id = db.Column(db.String(36), db.ForeignKey('profiles.id'), nullable=False)
    created_by = db.Column(db.String(36), db.ForeignKey('profiles.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    creator = db.relationship('User', foreign_keys=[created_by], backref='created_tasks')
    
    def __repr__(self):
        return f'<Task {self.task_id}: {self.text[:50]}...>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'task_id': self.task_id,
            'text': self.text,
            'assign_to': self.assign_to,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'status': self.status,
            'label': self.label,
            'priority': self.priority,
            'notes': self.notes,
            'alert_time': self.alert_time.isoformat() if self.alert_time else None,
            'owner_id': self.owner_id,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
