from ..database import db
from datetime import datetime
import uuid

class Person(db.Model):
    __tablename__ = 'people'
    
    # Core Identifiers
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    first_name = db.Column(db.String(255))
    last_name = db.Column(db.String(255))
    gender = db.Column(db.String(10))
    birthday = db.Column(db.Date)
    
    # Professional Info
    organization = db.Column(db.String(255))  # company / affiliation
    job_title = db.Column(db.String(255))
    job_status = db.Column(db.String(20))
    
    # Communication Info
    email = db.Column(db.String(255), unique=True)
    phone = db.Column(db.String(255))
    mobile = db.Column(db.String(255))
    address = db.Column(db.Text)
    
    # Social & Online Profiles
    linkedin_url = db.Column(db.String(500))
    github_url = db.Column(db.String(500))
    facebook_url = db.Column(db.String(500))
    twitter_url = db.Column(db.String(500))
    website_url = db.Column(db.String(500))
    
    # Connection Management Metadata
    notes = db.Column(db.Text)  # free text for relationship context
    source = db.Column(db.String(255))  # how you got the contact (event, referral, etc.)
    tags = db.Column(db.Text)  # labels/categories
    last_contact_date = db.Column(db.DateTime)
    next_follow_up_date = db.Column(db.DateTime)
    status = db.Column(db.String(20))
    priority = db.Column(db.String(10))
    group = db.Column(db.String(255))  # favourites, job, friends, etc.
    
    # Custom Fields (JSON)
    custom_fields = db.Column(db.JSON, nullable=True)
    
    # System Metadata
    owner_id = db.Column(db.String(36), db.ForeignKey('profiles.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        full_name = f"{self.first_name or ''} {self.last_name or ''}".strip()
        return f'<Person {full_name or "Unknown"}>'
    
    def to_dict(self):
        return {
            # Core Identifiers
            'id': self.id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'full_name': f"{self.first_name or ''} {self.last_name or ''}".strip(),
            'gender': self.gender,
            'birthday': self.birthday.isoformat() if self.birthday else None,
            
            # Professional Info
            'organization': self.organization,
            'job_title': self.job_title,
            'job_status': self.job_status,
            
            # Communication Info
            'email': self.email,
            'phone': self.phone,
            'mobile': self.mobile,
            'address': self.address,
            
            # Social & Online Profiles
            'linkedin_url': self.linkedin_url,
            'github_url': self.github_url,
            'facebook_url': self.facebook_url,
            'twitter_url': self.twitter_url,
            'website_url': self.website_url,
            
            # Connection Management Metadata
            'notes': self.notes,
            'source': self.source,
            'tags': self.tags,
            'last_contact_date': self.last_contact_date.isoformat() if self.last_contact_date else None,
            'next_follow_up_date': self.next_follow_up_date.isoformat() if self.next_follow_up_date else None,
            'status': self.status,
            'priority': self.priority,
            'group': self.group,
            
            # Custom Fields
            'custom_fields': self.custom_fields or {},
            
            # System Metadata
            'owner_id': self.owner_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def get_full_name(self):
        """Get the full name by combining first and last name"""
        full_name = f"{self.first_name or ''} {self.last_name or ''}".strip()
        return full_name if full_name else "Unknown"
    
    def get_available_fields(self, custom_field_definitions=None):
        """Get list of fields that have values (not null)"""
        available_fields = []
        field_mapping = {
            'first_name': 'First Name',
            'last_name': 'Last Name',
            'gender': 'Gender',
            'birthday': 'Birthday',
            'organization': 'Organization',
            'job_title': 'Job Title',
            'job_status': 'Job Status',
            'email': 'Email',
            'phone': 'Phone',
            'mobile': 'Mobile',
            'address': 'Address',
            'linkedin_url': 'LinkedIn',
            'github_url': 'GitHub',
            'facebook_url': 'Facebook',
            'twitter_url': 'Twitter',
            'website_url': 'Website',
            'notes': 'Notes',
            'source': 'Source',
            'tags': 'Tags',
            'last_contact_date': 'Last Contact Date',
            'next_follow_up_date': 'Next Follow-up Date',
            'status': 'Status',
            'priority': 'Priority',
            'group': 'Group'
        }
        
        # Add standard fields
        for field, display_name in field_mapping.items():
            value = getattr(self, field)
            if value is not None and str(value).strip():
                available_fields.append({
                    'field': field,
                    'display_name': display_name,
                    'value': value,
                    'type': self._get_field_type(field),
                    'is_custom': False
                })
        
        # Add custom fields
        if self.custom_fields:
            for field_key, field_value in self.custom_fields.items():
                if field_value is not None and str(field_value).strip():
                    # Find the field definition if available
                    field_def = None
                    if custom_field_definitions:
                        field_def = next((f for f in custom_field_definitions if f['key'] == field_key), None)
                    
                    if field_def:
                        available_fields.append({
                            'field': f"custom_{field_key}",
                            'display_name': field_def['name'],
                            'value': field_value,
                            'type': field_def['type'],
                            'is_custom': True,
                            'custom_key': field_key
                        })
                    else:
                        # Fallback if no field definition available
                        available_fields.append({
                            'field': f"custom_{field_key}",
                            'display_name': field_key.replace('_', ' ').title(),
                            'value': field_value,
                            'type': 'text',
                            'is_custom': True,
                            'custom_key': field_key
                        })
        
        return available_fields
    
    def _get_field_type(self, field):
        """Get the field type for form rendering"""
        if field in ['birthday', 'last_contact_date', 'next_follow_up_date']:
            return 'date'
        elif field in ['gender', 'job_status', 'status', 'priority']:
            return 'select'
        elif field in ['notes', 'address']:
            return 'textarea'
        elif field in ['email', 'phone', 'mobile']:
            return 'email' if field == 'email' else 'tel'
        elif 'url' in field:
            return 'url'
        else:
            return 'text'
