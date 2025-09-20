#!/usr/bin/env python3
"""
Script to set up the database schema using SQLAlchemy models.
This creates all the necessary tables based on the existing Supabase schema.
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app, db
from models import User, Person, Company, Task, SharedData, TelegramUser

def setup_database():
    """Set up the database schema"""
    with app.app_context():
        # Create all tables
        db.create_all()
        
        # Create admin users
        admin_emails = ['guy@wershuffle.com', 'roee2912@gmail.com']
        
        for email in admin_emails:
            existing_user = User.query.filter_by(email=email).first()
            if not existing_user:
                user = User(
                    email=email,
                    full_name='Admin User' if email == 'guy@wershuffle.com' else 'Roee Feingold',
                    is_approved=True,
                    approved_at=db.func.now(),
                    approved_by=None  # Will be set after creation
                )
                db.session.add(user)
                db.session.flush()  # Get the ID
                user.approved_by = user.id
                db.session.commit()
                print(f"Created admin user: {email}")
            else:
                print(f"Admin user already exists: {email}")
        
        print("Database setup completed successfully!")

if __name__ == '__main__':
    setup_database()
