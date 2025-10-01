#!/usr/bin/env python3
"""
Comprehensive test suite for Telegram bot functions
Tests all functionality with mock data generation
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app
from models import User, Person, Company, Task, TelegramUser
from database import db
from routes.telegram import process_natural_language_request
import uuid
from datetime import datetime, timedelta
import random

class TelegramBotTester:
    def __init__(self):
        self.test_user = None
        self.test_telegram_user = None
        self.setup_test_data()
    
    def setup_test_data(self):
        """Create test user and telegram user"""
        with app.app_context():
            # Find or create test user
            self.test_user = User.query.filter_by(email="test@example.com").first()
            if not self.test_user:
                self.test_user = User(
                    id=str(uuid.uuid4()),
                    email="test@example.com",
                    full_name="Test User",
                    is_approved=True
                )
                db.session.add(self.test_user)
                print(f"✅ Created test user: {self.test_user.email}")
            else:
                print(f"✅ Found existing test user: {self.test_user.email}")
            
            # Find or create test telegram user
            self.test_telegram_user = TelegramUser.query.filter_by(telegram_id=123456789).first()
            if not self.test_telegram_user:
                self.test_telegram_user = TelegramUser(
                    id=str(uuid.uuid4()),
                    telegram_id=123456789,
                    telegram_username="testuser",
                    first_name="Test User",
                    user_id=self.test_user.id,
                    is_authenticated=True,
                    current_state='idle'
                )
                db.session.add(self.test_telegram_user)
                print(f"✅ Created test telegram user: {self.test_telegram_user.first_name}")
            else:
                # Update existing telegram user
                self.test_telegram_user.user_id = self.test_user.id
                self.test_telegram_user.is_authenticated = True
                self.test_telegram_user.current_state = 'idle'
                print(f"✅ Updated existing telegram user: {self.test_telegram_user.first_name}")
            
            db.session.commit()
    
    def generate_mock_people(self, count=5):
        """Generate mock people data"""
        with app.app_context():
            # Get fresh user reference
            user = User.query.get(self.test_user.id)
            people_data = []
            names = [
                ("John", "Doe", "john.doe@company.com"),
                ("Jane", "Smith", "jane.smith@tech.com"),
                ("Mike", "Johnson", "mike.johnson@startup.io"),
                ("Sarah", "Wilson", "sarah.wilson@corp.com"),
                ("David", "Brown", "david.brown@enterprise.com"),
                ("Lisa", "Davis", "lisa.davis@innovate.com"),
                ("Tom", "Miller", "tom.miller@business.com"),
                ("Amy", "Garcia", "amy.garcia@tech.com"),
                ("Chris", "Martinez", "chris.martinez@startup.io"),
                ("Emma", "Anderson", "emma.anderson@corp.com")
            ]
            
            companies = ["Tech Corp", "Startup Inc", "Business Ltd", "Innovation Co", "Enterprise Solutions"]
            positions = ["CEO", "CTO", "Developer", "Manager", "Analyst", "Designer", "Engineer", "Director"]
            
            for i in range(count):
                first_name, last_name, email = names[i % len(names)]
                company = companies[i % len(companies)]
                position = positions[i % len(positions)]
                
                person = Person(
                    id=str(uuid.uuid4()),
                    first_name=first_name,
                    last_name=last_name,
                    email=email,
                    company=company,
                    position=position,
                    phone=f"+1-555-{random.randint(100, 999)}-{random.randint(1000, 9999)}",
                    linkedin_url=f"https://linkedin.com/in/{first_name.lower()}-{last_name.lower()}",
                    owner_id=user.id
                )
                db.session.add(person)
                people_data.append({
                    'name': f"{first_name} {last_name}",
                    'email': email,
                    'company': company,
                    'position': position
                })
            
            db.session.commit()
            print(f"✅ Generated {count} mock people")
            return people_data
    
    def generate_mock_companies(self, count=3):
        """Generate mock companies data"""
        with app.app_context():
            # Get fresh user reference
            user = User.query.get(self.test_user.id)
            companies_data = []
            company_names = [
                "Tech Innovations Inc",
                "Digital Solutions Ltd", 
                "Future Systems Corp",
                "Smart Technologies LLC",
                "NextGen Enterprises"
            ]
            
            industries = ["Technology", "Healthcare", "Finance", "Education", "Manufacturing"]
            sizes = ["1-10", "11-50", "51-200", "201-500", "500+"]
            
            for i in range(count):
                name = company_names[i % len(company_names)]
                industry = industries[i % len(industries)]
                size = sizes[i % len(sizes)]
                
                company = Company(
                    id=str(uuid.uuid4()),
                    name=name,
                    industry=industry,
                    size=size,
                    website=f"https://{name.lower().replace(' ', '')}.com",
                    description=f"Leading {industry.lower()} company focused on innovation",
                    owner_id=user.id
                )
                db.session.add(company)
                companies_data.append({
                    'name': name,
                    'industry': industry,
                    'size': size
                })
            
            db.session.commit()
            print(f"✅ Generated {count} mock companies")
            return companies_data
    
    def generate_mock_tasks(self, count=4):
        """Generate mock tasks data"""
        with app.app_context():
            # Get fresh user reference
            user = User.query.get(self.test_user.id)
            tasks_data = []
            task_texts = [
                "Call John about project proposal",
                "Review quarterly reports",
                "Schedule team meeting",
                "Update website content",
                "Prepare presentation for client",
                "Follow up with potential leads",
                "Organize company event",
                "Research new technologies"
            ]
            
            statuses = ["todo", "in_progress", "completed"]
            priorities = ["low", "medium", "high"]
            labels = ["work", "personal", "urgent", "follow-up"]
            
            for i in range(count):
                text = task_texts[i % len(task_texts)]
                status = statuses[i % len(statuses)]
                priority = priorities[i % len(priorities)]
                label = labels[i % len(labels)]
                
                # Random due date within next 30 days
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
                tasks_data.append({
                    'text': text,
                    'status': status,
                    'priority': priority,
                    'label': label
                })
            
            db.session.commit()
            print(f"✅ Generated {count} mock tasks")
            return tasks_data
    
    def test_search_people(self):
        """Test searching for people"""
        print("\n🔍 Testing People Search...")
        
        test_queries = [
            "Find John",
            "Search for people at Tech Corp",
            "Show me contacts with email",
            "Find developers",
            "Search people by company"
        ]
        
        for query in test_queries:
            print(f"\n📝 Query: '{query}'")
            try:
                response = process_natural_language_request(query, self.test_telegram_user)
                print(f"✅ Response: {response[:200]}...")
            except Exception as e:
                print(f"❌ Error: {e}")
    
    def test_add_people(self):
        """Test adding people"""
        print("\n➕ Testing Add People...")
        
        test_queries = [
            "Add roee feingold with email roee@example.com",
            "Add new contact: Alice Johnson, alice@tech.com, Software Engineer at TechCorp",
            "Add person: Bob Smith, bob@startup.io, CEO"
        ]
        
        for query in test_queries:
            print(f"\n📝 Query: '{query}'")
            try:
                response = process_natural_language_request(query, self.test_telegram_user)
                print(f"✅ Response: {response[:200]}...")
            except Exception as e:
                print(f"❌ Error: {e}")
    
    def test_search_tasks(self):
        """Test searching for tasks"""
        print("\n🔍 Testing Task Search...")
        
        test_queries = [
            "Show my tasks",
            "Find urgent tasks",
            "Show completed work",
            "What tasks do I have today?",
            "Show high priority tasks"
        ]
        
        for query in test_queries:
            print(f"\n📝 Query: '{query}'")
            try:
                response = process_natural_language_request(query, self.test_telegram_user)
                print(f"✅ Response: {response[:200]}...")
            except Exception as e:
                print(f"❌ Error: {e}")
    
    def test_add_tasks(self):
        """Test adding tasks"""
        print("\n➕ Testing Add Tasks...")
        
        test_queries = [
            "Add task: Call client tomorrow",
            "Create task: Review documents, high priority",
            "Add urgent task: Fix bug in production"
        ]
        
        for query in test_queries:
            print(f"\n📝 Query: '{query}'")
            try:
                response = process_natural_language_request(query, self.test_telegram_user)
                print(f"✅ Response: {response[:200]}...")
            except Exception as e:
                print(f"❌ Error: {e}")
    
    def test_search_companies(self):
        """Test searching for companies"""
        print("\n🔍 Testing Company Search...")
        
        test_queries = [
            "Find companies",
            "Show tech companies",
            "Search for startups",
            "Find companies by industry"
        ]
        
        for query in test_queries:
            print(f"\n📝 Query: '{query}'")
            try:
                response = process_natural_language_request(query, self.test_telegram_user)
                print(f"✅ Response: {response[:200]}...")
            except Exception as e:
                print(f"❌ Error: {e}")
    
    def test_general_search(self):
        """Test general information search"""
        print("\n🔍 Testing General Search...")
        
        test_queries = [
            "Find information about AI",
            "Search for project data",
            "Show me everything",
            "What do I have?"
        ]
        
        for query in test_queries:
            print(f"\n📝 Query: '{query}'")
            try:
                response = process_natural_language_request(query, self.test_telegram_user)
                print(f"✅ Response: {response[:200]}...")
            except Exception as e:
                print(f"❌ Error: {e}")
    
    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting Telegram Bot Function Tests")
        print("=" * 60)
        
        # Generate mock data
        print("\n📊 Generating Mock Data...")
        people_data = self.generate_mock_people(8)
        companies_data = self.generate_mock_companies(3)
        tasks_data = self.generate_mock_tasks(6)
        
        print(f"\n📋 Mock Data Summary:")
        print(f"   👥 People: {len(people_data)}")
        print(f"   🏢 Companies: {len(companies_data)}")
        print(f"   ✅ Tasks: {len(tasks_data)}")
        
        # Run all tests
        self.test_search_people()
        self.test_add_people()
        self.test_search_tasks()
        self.test_add_tasks()
        self.test_search_companies()
        self.test_general_search()
        
        print("\n🎉 All tests completed!")
        print("=" * 60)
    
    def cleanup(self):
        """Clean up test data"""
        with app.app_context():
            # Delete test data
            Person.query.filter_by(owner_id=self.test_user.id).delete()
            Company.query.filter_by(owner_id=self.test_user.id).delete()
            Task.query.filter_by(owner_id=self.test_user.id).delete()
            TelegramUser.query.filter_by(id=self.test_telegram_user.id).delete()
            User.query.filter_by(id=self.test_user.id).delete()
            
            db.session.commit()
            print("🧹 Cleaned up test data")

def main():
    """Main test function"""
    tester = TelegramBotTester()
    
    try:
        tester.run_all_tests()
    except KeyboardInterrupt:
        print("\n🛑 Tests interrupted by user")
    except Exception as e:
        print(f"\n💥 Test error: {e}")
    finally:
        # Uncomment to clean up test data
        # tester.cleanup()
        pass

if __name__ == "__main__":
    main()
