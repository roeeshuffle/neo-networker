from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import Base

class UserGroup(Base):
    __tablename__ = 'user_groups'
    
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey('profiles.id'), nullable=False)
    member_email = Column(String(255), nullable=False)
    member_name = Column(String(255), nullable=True)
    added_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Ensure unique owner-member combinations
    __table_args__ = (
        UniqueConstraint('owner_id', 'member_email', name='unique_owner_member'),
    )
    
    # Relationship to owner
    owner = relationship("User", foreign_keys=[owner_id], back_populates="group_members")
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.member_email,
            'full_name': self.member_name,
            'added_at': self.added_at.isoformat() if self.added_at else None
        }
