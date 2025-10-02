#!/usr/bin/env python3
"""
Comprehensive test suite for Telegram bot functions
Tests all functionality with mock data generation
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'backend'))

from api.app import app
from dal.models import User, Person, Task, Event
from dal.database import db
from api.routes.telegram import process_natural_language_request
import uuid
from datetime import datetime, timedelta
import random

class TelegramBotTester:
    def __init__(self):
        self.test_user = None
        self.test_telegram_user = None
        self.setup_test_data()
    
    def setup_test_data(self):
        """Create test user and mock telegram user"""
        with app.app_context():
            # Find or create test user
            self.test_user = User.query.filter_by(email="test@example.com").first()
            if not self.test_user:
                self.test_user = User(
                    id=str(uuid.uuid4()),
                    email="test@example.com",
                    full_name="Test User",
                    is_approved=True,
                    telegram_id=123456789,
                    telegram_username="testuser"
                )
                db.session.add(self.test_user)
                print(f"✅ Created test user: {self.test_user.email}")
            else:
                print(f"✅ Found existing test user: {self.test_user.email}")
            
            # Create mock telegram user object (since TelegramUser model was removed)
            class MockTelegramUser:
                def __init__(self, user):
                    self.telegram_id = user.telegram_id
                    self.user_id = user.id
                    self.current_state = 'idle'
                    self.first_name = user.full_name
            
            self.test_telegram_user = MockTelegramUser(self.test_user)
            print(f"✅ Created mock telegram user: {self.test_telegram_user.first_name}")
            
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
    
    # Company model was removed - no longer needed
    
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
    
    # Company search test removed - Company model was deleted
    
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
    
    def test_assistant_show_tasks(self):
        """Test the assistant with 'show tasks' command - EXPECTED FORMAT: [5, {"period": "daily"}]"""
        print("\n🤖 Testing Assistant API: 'show tasks'")
        print("=" * 50)
        
        query = "show tasks"
        print(f"📝 Query: '{query}'")
        
        try:
            response = process_natural_language_request(query, self.test_telegram_user)
            print(f"✅ Assistant Response: {response}")
            
            # Parse and validate the response format
            import json
            try:
                parsed_response = json.loads(response)
                if isinstance(parsed_response, list) and len(parsed_response) == 2:
                    count = parsed_response[0]
                    period_info = parsed_response[1]
                    
                    if isinstance(count, int) and isinstance(period_info, dict) and "period" in period_info:
                        print(f"✅ Response format is correct!")
                        print(f"   📊 Task count: {count}")
                        print(f"   📅 Period: {period_info['period']}")
                        return True
                    else:
                        print(f"❌ Response format incorrect: expected [int, {{'period': str}}]")
                        return False
                else:
                    print(f"❌ Response format incorrect: expected list with 2 elements")
                    return False
            except json.JSONDecodeError:
                print(f"❌ Response is not valid JSON: {response}")
                return False
                
        except Exception as e:
            print(f"❌ Error calling assistant: {e}")
            return False
    
    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting Telegram Bot Function Tests")
        print("=" * 60)
        
        # Generate mock data
        print("\n📊 Generating Mock Data...")
        people_data = self.generate_mock_people(8)
        tasks_data = self.generate_mock_tasks(6)
        
        print(f"\n📋 Mock Data Summary:")
        print(f"   👥 People: {len(people_data)}")
        print(f"   ✅ Tasks: {len(tasks_data)}")
        
        # Run all tests
        self.test_search_people()
        self.test_add_people()
        self.test_search_tasks()
        self.test_add_tasks()
        self.test_general_search()
        
        # Test Assistant API functionality
        assistant_test_passed = self.test_assistant_show_tasks()
        print(f"\n🤖 Assistant API Test: {'✅ PASSED' if assistant_test_passed else '❌ FAILED'}")
        
        print("\n🎉 All tests completed!")
        print("=" * 60)
    
    def cleanup(self):
        """Clean up test data"""
        with app.app_context():
            # Delete test data
            Person.query.filter_by(owner_id=self.test_user.id).delete()
            Task.query.filter_by(owner_id=self.test_user.id).delete()
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
