#!/usr/bin/env python3
"""
Simple Telegram Bot Test
Tests the core functionality without complex database operations
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app
from backend.dal.models import User, Person, Company, Task, TelegramUser
from backend.dal.database import db
from routes.telegram import process_natural_language_request
import uuid
from datetime import datetime, timedelta
import random

def create_test_data():
    """Create test data in a single session"""
    with app.app_context():
        # Clean up existing test data first
        Person.query.filter(Person.full_name.in_(['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson', 'David Brown'])).delete()
        Company.query.filter(Company.record.like('%Innovations%')).delete()
        Task.query.filter(Task.text.like('%project%')).delete()
        
        # Find or create test user
        user = User.query.filter_by(email="test@example.com").first()
        if not user:
            user = User(
                id=str(uuid.uuid4()),
                email="test@example.com",
                full_name="Test User",
                is_approved=True
            )
            db.session.add(user)
            db.session.commit()
        
        # Create test people
        people_data = [
            ("John Doe", "john.doe@company.com", "Tech Corp", "CEO"),
            ("Jane Smith", "jane.smith@tech.com", "Startup Inc", "CTO"),
            ("Mike Johnson", "mike.johnson@startup.io", "Business Ltd", "Developer"),
            ("Sarah Wilson", "sarah.wilson@corp.com", "Innovation Co", "Manager"),
            ("David Brown", "david.brown@enterprise.com", "Enterprise Solutions", "Analyst")
        ]
        
        for full_name, email, company, position in people_data:
            person = Person(
                id=str(uuid.uuid4()),
                full_name=full_name,
                email=email,
                company=company,
                status=position,
                linkedin_profile=f"https://linkedin.com/in/{full_name.lower().replace(' ', '-')}",
                owner_id=user.id
            )
            db.session.add(person)
        
        # Create test companies
        companies_data = [
            ("Tech Innovations Inc", "Technology", "51-200"),
            ("Digital Solutions Ltd", "Healthcare", "11-50"),
            ("Future Systems Corp", "Finance", "201-500")
        ]
        
        for name, industry, size in companies_data:
            company = Company(
                id=str(uuid.uuid4()),
                record=name,
                categories=industry,
                description=f"Leading {industry.lower()} company focused on innovation",
                owner_id=user.id,
                created_by=user.id
            )
            db.session.add(company)
        
        # Create test tasks
        tasks_data = [
            ("Call John about project proposal", "todo", "high", "work"),
            ("Review quarterly reports", "in_progress", "medium", "urgent"),
            ("Schedule team meeting", "todo", "low", "follow-up"),
            ("Update website content", "completed", "medium", "work")
        ]
        
        for text, status, priority, label in tasks_data:
            due_date = datetime.utcnow() + timedelta(days=random.randint(1, 30))
            task = Task(
                id=str(uuid.uuid4()),
                text=text,
                status=status,
                priority=priority,
                label=label,
                due_date=due_date,
                owner_id=user.id
            )
            db.session.add(task)
        
        db.session.commit()
        print(f"✅ Created test data for user: {user.email}")
        return user

def create_test_telegram_user(user):
    """Create test telegram user"""
    with app.app_context():
        telegram_user = TelegramUser.query.filter_by(telegram_id=123456789).first()
        if not telegram_user:
            telegram_user = TelegramUser(
                id=str(uuid.uuid4()),
                telegram_id=123456789,
                telegram_username="testuser",
                first_name="Test User",
                user_id=user.id,
                is_authenticated=True,
                current_state='idle'
            )
            db.session.add(telegram_user)
        else:
            telegram_user.user_id = user.id
            telegram_user.is_authenticated = True
            telegram_user.current_state = 'idle'
        
        db.session.commit()
        print(f"✅ Created/updated telegram user: {telegram_user.first_name}")
        return telegram_user

def test_telegram_functions():
    """Test all telegram functions"""
    print("🚀 Starting Simple Telegram Bot Test")
    print("=" * 50)
    
    # Create test data
    user = create_test_data()
    telegram_user = create_test_telegram_user(user)
    
    # Test queries
    test_queries = [
        # People search
        ("Find John", "People Search"),
        ("Search for people at Tech Corp", "Company People Search"),
        ("Show me contacts with email", "Email Contacts Search"),
        ("Find developers", "Role Search"),
        
        # People add
        ("Add roee feingold with email roee@example.com", "Add Person"),
        ("Add new contact: Alice Johnson, alice@tech.com, Software Engineer", "Add Person with Details"),
        
        # Task search
        ("Show my tasks", "Task List"),
        ("Find urgent tasks", "Urgent Tasks"),
        ("Show completed work", "Completed Tasks"),
        ("What tasks do I have today?", "Today's Tasks"),
        
        # Task add
        ("Add task: Call client tomorrow", "Add Task"),
        ("Create task: Review documents, high priority", "Add Priority Task"),
        
        # Company search
        ("Find companies", "Company List"),
        ("Show tech companies", "Tech Companies"),
        ("Search for startups", "Startup Search"),
        
        # General search
        ("Find information about AI", "General Search"),
        ("Show me everything", "All Data Search")
    ]
    
    print(f"\n📋 Testing {len(test_queries)} queries...")
    print("=" * 50)
    
    for i, (query, description) in enumerate(test_queries, 1):
        print(f"\n{i:2d}. {description}")
        print(f"    Query: '{query}'")
        
        try:
            with app.app_context():
                response = process_natural_language_request(query, telegram_user)
                print(f"    ✅ Response: {response[:150]}...")
        except Exception as e:
            print(f"    ❌ Error: {e}")
    
    print(f"\n🎉 Test completed! Tested {len(test_queries)} queries.")
    print("=" * 50)

if __name__ == "__main__":
    test_telegram_functions()
