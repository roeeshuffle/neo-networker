#!/usr/bin/env python3
"""
Test for OpenAI Assistant API integration
Tests the "show tasks" functionality with expected response format
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
import json

class AssistantAPITester:
    def __init__(self):
        self.test_user = None
        self.setup_test_data()
    
    def setup_test_data(self):
        """Create test user and tasks"""
        with app.app_context():
            # Find or create test user
            self.test_user = User.query.filter_by(email="assistant_test@example.com").first()
            if not self.test_user:
                self.test_user = User(
                    id=str(uuid.uuid4()),
                    email="assistant_test@example.com",
                    full_name="Assistant Test User",
                    is_approved=True,
                    telegram_id=999888777  # Test telegram ID
                )
                db.session.add(self.test_user)
                print(f"✅ Created test user: {self.test_user.email}")
            else:
                print(f"✅ Found existing test user: {self.test_user.email}")
            
            # Create test tasks
            self.create_test_tasks()
            
            db.session.commit()
    
    def create_test_tasks(self):
        """Create test tasks for the assistant to find"""
        with app.app_context():
            # Clear existing tasks for this user
            Task.query.filter_by(owner_id=self.test_user.id).delete()
            
            # Create 5 test tasks
            tasks_data = [
                {
                    "text": "Call John about project proposal",
                    "status": "todo",
                    "priority": "high",
                    "label": "work"
                },
                {
                    "text": "Review quarterly reports", 
                    "status": "in_progress",
                    "priority": "medium",
                    "label": "work"
                },
                {
                    "text": "Schedule team meeting",
                    "status": "todo", 
                    "priority": "low",
                    "label": "work"
                },
                {
                    "text": "Update website content",
                    "status": "completed",
                    "priority": "medium",
                    "label": "work"
                },
                {
                    "text": "Prepare presentation for client",
                    "status": "todo",
                    "priority": "high", 
                    "label": "work"
                }
            ]
            
            for task_data in tasks_data:
                task = Task(
                    id=str(uuid.uuid4()),
                    text=task_data["text"],
                    status=task_data["status"],
                    priority=task_data["priority"],
                    label=task_data["label"],
                    owner_id=self.test_user.id
                )
                db.session.add(task)
            
            print(f"✅ Created {len(tasks_data)} test tasks")
    
    def test_assistant_show_tasks(self):
        """Test the assistant with 'show tasks' command"""
        print("\n🤖 Testing Assistant API: 'show tasks'")
        print("=" * 50)
        
        # Test query
        query = "show tasks"
        print(f"📝 Query: '{query}'")
        
        try:
            # Create a mock telegram user object for the test
            class MockTelegramUser:
                def __init__(self, user):
                    self.telegram_id = user.telegram_id
                    self.user_id = user.id
                    self.is_authenticated = True
                    self.current_state = 'idle'
            
            mock_telegram_user = MockTelegramUser(self.test_user)
            
            # Call the assistant
            response = process_natural_language_request(query, mock_telegram_user)
            print(f"✅ Assistant Response: {response}")
            
            # Parse the response to check format
            try:
                # Try to parse as JSON
                parsed_response = json.loads(response)
                print(f"✅ Parsed Response: {parsed_response}")
                
                # Check if response matches expected format: [5, {"period": "daily"}]
                if isinstance(parsed_response, list) and len(parsed_response) == 2:
                    count = parsed_response[0]
                    period_info = parsed_response[1]
                    
                    if isinstance(count, int) and isinstance(period_info, dict) and "period" in period_info:
                        print(f"✅ Response format is correct!")
                        print(f"   📊 Task count: {count}")
                        print(f"   📅 Period: {period_info['period']}")
                        
                        # Verify the count matches our test data
                        with app.app_context():
                            actual_task_count = Task.query.filter_by(owner_id=self.test_user.id).count()
                            if count == actual_task_count:
                                print(f"✅ Task count matches database: {actual_task_count}")
                                return True
                            else:
                                print(f"❌ Task count mismatch: expected {actual_task_count}, got {count}")
                                return False
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
            import traceback
            print(f"❌ Traceback: {traceback.format_exc()}")
            return False
    
    def test_assistant_variations(self):
        """Test variations of the show tasks command"""
        print("\n🔄 Testing Assistant API Variations")
        print("=" * 50)
        
        test_queries = [
            "show tasks",
            "show my tasks", 
            "list tasks",
            "what tasks do I have?",
            "display tasks"
        ]
        
        results = []
        
        for query in test_queries:
            print(f"\n📝 Query: '{query}'")
            try:
                # Create a mock telegram user object for the test
                class MockTelegramUser:
                    def __init__(self, user):
                        self.telegram_id = user.telegram_id
                        self.user_id = user.id
                        self.is_authenticated = True
                        self.current_state = 'idle'
                
                mock_telegram_user = MockTelegramUser(self.test_user)
                
                response = process_natural_language_request(query, mock_telegram_user)
                print(f"✅ Response: {response[:100]}...")
                
                # Try to parse and validate
                try:
                    parsed_response = json.loads(response)
                    if isinstance(parsed_response, list) and len(parsed_response) == 2:
                        results.append(True)
                        print(f"✅ Format correct for: {query}")
                    else:
                        results.append(False)
                        print(f"❌ Format incorrect for: {query}")
                except json.JSONDecodeError:
                    results.append(False)
                    print(f"❌ Not JSON for: {query}")
                    
            except Exception as e:
                print(f"❌ Error: {e}")
                results.append(False)
        
        success_rate = sum(results) / len(results) * 100
        print(f"\n📊 Success Rate: {success_rate:.1f}% ({sum(results)}/{len(results)})")
        return success_rate >= 80  # Expect at least 80% success rate
    
    def run_all_tests(self):
        """Run all assistant tests"""
        print("🚀 Starting Assistant API Tests")
        print("=" * 60)
        
        # Test 1: Basic show tasks functionality
        test1_passed = self.test_assistant_show_tasks()
        
        # Test 2: Variations of show tasks
        test2_passed = self.test_assistant_variations()
        
        # Summary
        print("\n📋 Test Results Summary:")
        print("=" * 30)
        print(f"✅ Basic 'show tasks' test: {'PASSED' if test1_passed else 'FAILED'}")
        print(f"✅ Variations test: {'PASSED' if test2_passed else 'FAILED'}")
        
        overall_success = test1_passed and test2_passed
        print(f"\n🎯 Overall Result: {'✅ ALL TESTS PASSED' if overall_success else '❌ SOME TESTS FAILED'}")
        
        return overall_success
    
    def cleanup(self):
        """Clean up test data"""
        with app.app_context():
            # Delete test data
            Task.query.filter_by(owner_id=self.test_user.id).delete()
            User.query.filter_by(id=self.test_user.id).delete()
            
            db.session.commit()
            print("🧹 Cleaned up test data")

def main():
    """Main test function"""
    tester = AssistantAPITester()
    
    try:
        success = tester.run_all_tests()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n🛑 Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Test error: {e}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")
        return 1
    finally:
        # Uncomment to clean up test data
        # tester.cleanup()
        pass

if __name__ == "__main__":
    exit(main())
